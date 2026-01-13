-- Migration: Add trigger_on_start column to production_sampling_plans
-- Date: 2026-01-12
-- Description: Ensures the trigger_on_start column exists for the MES sampling automation.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'production_sampling_plans' 
                   AND column_name = 'trigger_on_start') THEN
        ALTER TABLE public.production_sampling_plans 
            ADD COLUMN trigger_on_start BOOLEAN DEFAULT true;
    END IF;

    -- Also add parameter_ids if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'production_sampling_plans' 
                   AND column_name = 'parameter_ids') THEN
        ALTER TABLE public.production_sampling_plans 
            ADD COLUMN parameter_ids UUID[];
    END IF;

    -- Also add process_context if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'production_sampling_plans' 
                   AND column_name = 'process_context') THEN
        ALTER TABLE public.production_sampling_plans 
            ADD COLUMN process_context TEXT;
    END IF;
END $$;

-- Add index for the trigger_on_start query used by SamplingOrchestratorService
CREATE INDEX IF NOT EXISTS idx_sampling_plans_automation 
    ON public.production_sampling_plans(product_id, trigger_on_start, is_active) 
    WHERE trigger_on_start = true AND is_active = true;
