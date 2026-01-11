-- Migration: Add Production Batch ID to PCC Logs
-- Date: 2026-01-11
-- Description: Adds production_batch_id FK to pcc_logs to support dashboard queries.

DO $$ 
BEGIN 
    -- Add column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pcc_logs' AND column_name = 'production_batch_id') THEN
        ALTER TABLE public.pcc_logs
        ADD COLUMN production_batch_id UUID REFERENCES public.production_batches(id) ON DELETE CASCADE;

        -- Add Index
        CREATE INDEX idx_pcc_logs_batch ON public.pcc_logs(production_batch_id);
    END IF;
END $$;
