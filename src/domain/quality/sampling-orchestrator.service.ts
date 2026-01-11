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
            .eq("product_id", batch.product_id)
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
                spec_version_id: batch.spec_version_id // Propagate locked spec version
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
        // Suppress if Stopped or Breakdown
        const { data: lastEvent } = await this.supabase
            .from("production_events")
            .select("event_type")
            .eq("production_batch_id", batchId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

        const isRunning = !lastEvent || !['stop', 'breakdown', 'maintenance'].includes(lastEvent.event_type);
        if (!isRunning) return { suppressed: true, reason: "PRODUCTION_STOPPED" };

        // 2. Find PENDING reminders that are due
        const { data: dueReminders } = await this.supabase
            .from("production_sampling_reminders")
            .select("*, plan:production_sampling_plans(*)")
            .eq("production_batch_id", batchId)
            .eq("status", "pending")
            .lte("next_sample_due_at", new Date().toISOString());

        if (!dueReminders || dueReminders.length === 0) return { samples_created: 0 };

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
                spec_version_id: batchContext?.spec_version_id
            });

            if (result.success) {
                // Update Reminder Status
                await this.supabase
                    .from("production_sampling_reminders")
                    .update({
                        status: 'completed',
                        last_sample_id: result.data.id,
                        last_sample_at: new Date().toISOString()
                    })
                    .eq("id", reminder.id);

                // Schedule NEXT Reminder
                await this.initializeReminder(batchId, reminder.sampling_plan_id, result.data.id, reminder.plan.frequency_minutes);
                created.push(result.data.id);
            }
        }

        return { samples_created: created.length, ids: created };
    }

    private async initializeReminder(batchId: string, planId: string, lastSampleId: string, frequencyMinutes: number) {
        const nextDue = new Date(Date.now() + frequencyMinutes * 60000).toISOString();

        await this.supabase
            .from("production_sampling_reminders")
            .insert({
                organization_id: this.context.organization_id,
                plant_id: this.context.plant_id,
                production_batch_id: batchId,
                sampling_plan_id: planId,
                last_sample_id: lastSampleId,
                last_sample_at: new Date().toISOString(),
                next_sample_due_at: nextDue,
                status: 'pending'
            });
    }
}
