-- Migration: Unified Product Hierarchy and Explicit MES Linkage
-- Date: 2026-01-05
-- Description: Unifies product categories and adds explicit product_id to intermediate_products for snapshotting and audit rigor.

-- 1. Unify Product Categories
-- Migrates legacy names like 'intermediate_product' or 'Produto Intermédio' to the canonical 'intermediate'.
UPDATE public.products 
SET category = 'intermediate' 
WHERE category IN ('intermediate_product', 'Produto Intermédio');

-- Also ensure 'final_product' or 'Produto Final' goes to 'final' if they exist (standardizing)
UPDATE public.products 
SET category = 'final' 
WHERE category IN ('final_product', 'Produto Final');

-- 2. Add product_id to intermediate_products
-- This field will store the explicit product definition for the tank/mix at the moment of creation.
ALTER TABLE public.intermediate_products 
    ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Create index for performance on genealogy queries
CREATE INDEX idx_intermediate_products_product_id ON public.intermediate_products(product_id);

-- 3. Data Cleanup: Backfill product_id for existing tanks
-- We infer the product_id by looking at the parent_id of the final product being produced in the batch.
UPDATE public.intermediate_products ip
SET product_id = p_parent.id
FROM public.production_batches pb
JOIN public.products p_final ON pb.product_id = p_final.id
JOIN public.products p_parent ON p_final.parent_id = p_parent.id
WHERE ip.production_batch_id = pb.id
  AND ip.product_id IS NULL;

-- 4. Unified Audit Traceability
-- Ensure product_history also follows the unified category names for future records.
-- (Existing history records are usually left as is for strict audit, but we can standardize the logic moving forward).

COMMENT ON COLUMN public.intermediate_products.product_id IS 'Snapshot of the specific intermediate product definition for this tank execution.';
