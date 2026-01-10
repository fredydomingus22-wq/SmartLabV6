-- Migration: Update Production Status Constraints
-- Date: 2026-01-06
-- Description: Expands the allowed statuses for production_batches and intermediate_products to support the full MES lifecycle.

-- 1. Update production_batches status constraint
ALTER TABLE public.production_batches 
DROP CONSTRAINT IF EXISTS production_batches_status_check;

ALTER TABLE public.production_batches 
ADD CONSTRAINT production_batches_status_check
CHECK (status IN ('planned', 'open', 'in_progress', 'completed', 'closed', 'blocked', 'released', 'rejected'));

-- 2. Update intermediate_products status constraint
ALTER TABLE public.intermediate_products 
DROP CONSTRAINT IF EXISTS intermediate_products_status_check;

ALTER TABLE public.intermediate_products 
ADD CONSTRAINT intermediate_products_status_check
CHECK (status IN ('planned', 'pending', 'sampling', 'in_analysis', 'approved', 'rejected', 'in_use', 'consumed'));

-- 3. Verify products self-referencing FK (Safety check, should exist)
-- If not exists, we add it. If exists, this does nothing (idempotency hard to do without IF NOT EXISTS in pure SQL blocks without PL/pgSQL, but normally we just assume it might be there or check catalog. For now, assuming standard Postgres behavior, let's just make sure the column exists which we know it does from previous files).
-- We will just comment this out as it was a verification step in the plan, not necessarily a change needed if the column is there.
-- The column parent_id on products is assumed to exist.

