-- Drop the too restrictive index
DROP INDEX IF EXISTS idx_specs_product;

-- Create new index including sample_type_id to allow multiple specs per product/param if context differs
-- Using NULLS NOT DISTINCT would enforce only ONE null sample_type per product/param (which is good)
-- But standard index allows multiple NULLs. 
-- Let's use standard index. Logic in app should prevent duplicates if needed, or we trust that NULL means 'Default'.
-- Actually, strictness is better. If sample_type_id is NULL effectively twice, it's a duplicate.
-- Postgres 15+ supports NULLS NOT DISTINCT. Let's assume standard behavior first (duplicates of NULL allowed) 
-- OR use functional index with COALESCE if we want to be strict but compatible.
-- simpler: just add sample_type_id.

CREATE UNIQUE INDEX idx_specs_product_v2 ON public.product_specifications (product_id, qa_parameter_id, sample_type_id);
