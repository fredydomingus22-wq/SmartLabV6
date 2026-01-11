
-- Migration: add_created_by_to_production_batches
-- Description: Adds created_by audit column to production_batches table

ALTER TABLE public.production_batches
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Optional: Add index for performance if filtering by creator
CREATE INDEX IF NOT EXISTS idx_production_batches_created_by ON public.production_batches(created_by);
