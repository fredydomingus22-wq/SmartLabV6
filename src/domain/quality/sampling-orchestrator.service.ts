import { SupabaseClient } from "@supabase/supabase-js";
import { SampleDomainService } from "../lab/sample.service";

/**
 * SamplingOrchestratorService
 * Manages automated and frequency-based sampling logic.
 * Integrates Production Execution with Quality Control.
 */
export class SamplingOrchestratorService {
    private sampleService: SampleDomainService;

    constructor(
        private supabase: SupabaseClient<any>,
        private context: {
            organization_id: string;
            user_id: string;
            role: string;
            plant_id: string;
            correlation_id?: string;
        }
    ) {
        this.sampleService = new SampleDomainService(supabase, {
            ...context,
            correlation_id: context.correlation_id || Date.now().toString()
        });
    }

    /**
     * Trigger initial sampling for a new batch
     */
    async triggerInitialSampling(batchId: string) {
        // 1. Fetch Batch context (including locked spec version)
        const { data: batch } = await this.supabase
            .from("production_batches")
            .select("product_id, spec_version_id")
            .eq("id", batchId)
            .single();

        if (!batch) throw new Error("Batch not found");

        // 2. Fetch Sampling Plans for this product (or general FP)
        const { data: plans } = await this.supabase
            .from("production_sampling_plans")
            .select("*")
            .or(`product_id.eq.${batch.product_id},product_id.is.null`)
            .eq("trigger_on_start", true)
            .eq("is_active", true);

        if (!plans || plans.length === 0) return;

        // 3. Create Samples & Initialize Reminders
        for (const plan of plans) {
            // Create Sample
            const result = await this.sampleService.registerSample({
                sample_type_id: plan.sample_type_id,
                plant_id: this.context.plant_id,
                production_batch_id: batchId,
                collected_at: new Date().toISOString(),
                process_context: plan.process_context, // Propagate phase context
                spec_version_id: batch.spec_version_id, // Propagate locked spec version
                parameter_ids: plan.parameter_ids
            });

            if (result.success) {
                // Initialize Reminder for NEXT sample
                await this.initializeReminder(batchId, plan.id, result.data.id, plan.frequency_minutes);
            }
        }
    }

    /**
     * Process Heartbeat: Check for due samples
     * Should be called periodically or on specific UI actions.
     */
    async processSamplingHeartbeat(batchId: string) {
        // 1. Verify if production is RUNNING (STATE-AWARENESS)
        const { data: batch } = await this.supabase
            .from("production_batches")
            .select("status, product_id")
            .eq("id", batchId)
            .single();

        if (!batch || (batch.status !== 'in_progress' && batch.status !== 'open')) {
            return { suppressed: true, reason: "PRODUCTION_NOT_IN_PROGRESS", status: batch?.status };
        }

        // 2. Fetch Active Time-Based Plans for this Product context
        const { data: activePlans, error: plansError } = await this.supabase
            .from("production_sampling_plans")
            .select("*")
            .eq("is_active", true)
            .eq("trigger_type", "time_based")
            .or(`product_id.eq.${batch.product_id},product_id.is.null`);

        const logs: string[] = [];
        if (plansError) logs.push(`[SamplingEngine] Plans Fetch Error: ${plansError.message}`);
        logs.push(`[SamplingEngine] Checking ${activePlans?.length || 0} active plans for batch ${batchId} (status: ${batch.status})`);

        if (activePlans && activePlans.length > 0) {
            for (const plan of activePlans) {
                const { count, error: countError } = await this.supabase
                    .from("production_sampling_reminders")
                    .select("*", { count: 'exact', head: true })
                    .eq("production_batch_id", batchId)
                    .eq("sampling_plan_id", plan.id);

                if (countError) {
                    logs.push(`[SamplingEngine] Error checking reminder count for plan ${plan.name}: ${countError.message}`);
                    continue;
                }

                if (!count || count === 0) {
                    logs.push(`[SamplingEngine] Initializing bridge reminder for plan: ${plan.name} (${plan.id})`);
                    console.log(`[SamplingEngine] Bridge reminder for plan: ${plan.name}`);
                    await this.initializeReminder(batchId, plan.id, null as any, plan.frequency_minutes || 60, true);
                }
            }
        }

        // 3. Find PENDING reminders that are due
        const now = new Date().toISOString();
        const { data: dueReminders, error: fetchError } = await this.supabase
            .from("production_sampling_reminders")
            .select("*, plan:production_sampling_plans(*)")
            .eq("production_batch_id", batchId)
            .eq("status", "pending")
            .lte("next_sample_due_at", now);

        logs.push(`[SamplingEngine] Found ${dueReminders?.length || 0} due reminders. Current time: ${now}`);
        if (fetchError) logs.push(`[SamplingEngine] Fetch Error: ${fetchError.message}`);

        if (!dueReminders || dueReminders.length === 0) return { samples_created: 0, logs };

        const created = [];
        for (const reminder of dueReminders) {
            // Fetch batch context for Spec Locking
            const { data: batchContext } = await this.supabase
                .from("production_batches")
                .select("spec_version_id")
                .eq("id", batchId)
                .single();

            // Create Sample
            const result = await this.sampleService.registerSample({
                sample_type_id: reminder.plan.sample_type_id,
                plant_id: this.context.plant_id,
                production_batch_id: batchId,
                collected_at: new Date().toISOString(),
                process_context: reminder.plan.process_context,
                spec_version_id: batchContext?.spec_version_id,
                parameter_ids: reminder.plan.parameter_ids,
                sampling_plan_id: reminder.sampling_plan_id
            });

            if (result.success) {
                console.log(`[SamplingEngine] Successfully registered sample ${result.data.id} for plan ${reminder.plan.name}`);
                // Update Reminder Status
                const { error: updateError } = await this.supabase
                    .from("production_sampling_reminders")
                    .update({
                        status: 'completed',
                        last_sample_id: result.data.id,
                        last_sample_at: new Date().toISOString()
                    })
                    .eq("id", reminder.id);

                if (updateError) console.error("[SamplingEngine] Error updating reminder status:", updateError);

                // Schedule NEXT Reminder
                await this.initializeReminder(batchId, reminder.sampling_plan_id, result.data.id, reminder.plan.frequency_minutes);
                created.push(result.data.id);
            } else {
                console.error(`[SamplingEngine] Failed to register sample for plan ${reminder.plan.name}:`, result.message);
            }
        }

        return { samples_created: created.length, ids: created };
    }

    private async initializeReminder(batchId: string, planId: string, lastSampleId: string, frequencyMinutes: number, dueNow: boolean = false) {
        const nextDue = dueNow ? new Date().toISOString() : new Date(Date.now() + frequencyMinutes * 60000).toISOString();

        await this.supabase
            .from("production_sampling_reminders")
            .insert({
                organization_id: this.context.organization_id,
                plant_id: this.context.plant_id,
                production_batch_id: batchId,
                sampling_plan_id: planId,
                last_sample_id: lastSampleId || null,
                last_sample_at: lastSampleId ? new Date().toISOString() : null,
                next_sample_due_at: nextDue,
                status: 'pending'
            });
    }
}
