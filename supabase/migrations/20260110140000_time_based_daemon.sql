-- Migration: Time-Based Sampling Daemon
-- Date: 2026-01-10
-- Description: Creates the function and cron job (if supported) to process time-based sampling plans.

-- 1. Function to evaluate time-based plans
CREATE OR REPLACE FUNCTION public.process_time_based_sampling_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    batch_record RECORD;
    plan_record RECORD;
    last_request_time TIMESTAMPTZ;
    should_trigger BOOLEAN;
BEGIN
    -- Loop through all Active Batches
    FOR batch_record IN 
        SELECT b.id, b.organization_id, b.plant_id, b.product_id, p.id as product_id_uuid 
        FROM public.production_batches b
        JOIN public.products p ON b.product_id = p.id
        WHERE b.status = 'in_progress'
    LOOP
        -- Loop through all Active Time-Based Plans applicable to this product (or global)
        FOR plan_record IN 
            SELECT * 
            FROM public.production_sampling_plans 
            WHERE is_active = true 
            AND trigger_type = 'time_based'
            AND (product_id IS NULL OR product_id = batch_record.product_id_uuid)
            AND organization_id = batch_record.organization_id
        LOOP
            -- Check last request generated for this specific Batch + Plan
            SELECT requested_at INTO last_request_time
            FROM public.sample_requests
            WHERE production_batch_id = batch_record.id
            AND sampling_plan_id = plan_record.id
            ORDER BY requested_at DESC
            LIMIT 1;

            should_trigger := FALSE;

            IF last_request_time IS NULL THEN
                -- Never triggered for this batch? Trigger immediately (or maybe after freq minutes? Defaulting to immediate/now)
                should_trigger := TRUE;
            ELSE
                -- Check if time elapsed > frequency
                IF EXTRACT(EPOCH FROM (NOW() - last_request_time)) / 60 >= plan_record.frequency_minutes THEN
                    should_trigger := TRUE;
                END IF;
            END IF;

            IF should_trigger THEN
                INSERT INTO public.sample_requests (
                    organization_id,
                    plant_id,
                    sampling_plan_id,
                    production_batch_id,
                    production_order_id,
                    status,
                    priority,
                    metadata
                ) VALUES (
                    batch_record.organization_id,
                    batch_record.plant_id,
                    plan_record.id,
                    batch_record.id,
                    NULL, -- Could fetch order if needed, but batch link is sufficient
                    'pending',
                    'normal',
                    jsonb_build_object(
                        'triggered_by', 'time_based_daemon',
                        'frequency_minutes', plan_record.frequency_minutes
                    )
                );
            END IF;

        END LOOP;
    END LOOP;
END;
$$;

-- 2. Attempt to schedule via pg_cron (Wrapped in block to avoid failure if extension missing)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule to run every minute
        -- Note: effectively 'unschedule' first to avoid duplicates if re-running migration
        PERFORM cron.unschedule('process-sampling-plans');
        PERFORM cron.schedule('process-sampling-plans', '* * * * *', 'SELECT public.process_time_based_sampling_plans()');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available or permission denied. Skipping automatic scheduling.';
END
$$;
