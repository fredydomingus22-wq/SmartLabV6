-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_quality_analysis_unique_dimension;

-- Add a UNIQUE constraint that treats NULLs as equal (Postgres 15+)
-- This allows UPSERT to work even when plant_id, product_id, etc. are NULL.
ALTER TABLE public.quality_analysis 
ADD CONSTRAINT quality_analysis_upsert_unique 
UNIQUE NULLS NOT DISTINCT (
    organization_id, 
    plant_id, 
    product_id, 
    parameter_id, 
    batch_id, 
    analysis_type
);
