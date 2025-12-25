-- Add production_batch_id to nonconformities for direct batch linking
-- This enables better traceability in batch reports

ALTER TABLE public.nonconformities 
ADD COLUMN IF NOT EXISTS production_batch_id UUID REFERENCES public.production_batches(id);

-- Add index for batch lookups
CREATE INDEX IF NOT EXISTS idx_nonconformities_batch 
ON public.nonconformities(production_batch_id);

-- Add product name to CoA (already in production_batches, no migration needed)
-- Just ensuring column exists
