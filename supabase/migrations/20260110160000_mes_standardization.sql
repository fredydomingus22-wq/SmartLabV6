-- Description: Renames equipment_id to tank_id in intermediate_products for domain alignment.
-- Date: 2026-01-10

-- 1. Rename Column
ALTER TABLE public.intermediate_products 
RENAME COLUMN equipment_id TO tank_id;

-- 2. Update Constraints (Drop old equipment FK if it exists, add tank FK)
ALTER TABLE public.intermediate_products 
DROP CONSTRAINT IF EXISTS intermediate_products_equipment_id_fkey;

-- Ensure it references the tanks table
ALTER TABLE public.intermediate_products 
ADD CONSTRAINT intermediate_products_tank_id_fkey 
FOREIGN KEY (tank_id) REFERENCES public.tanks(id) ON DELETE SET NULL;

-- 3. Update Indexes
DROP INDEX IF EXISTS idx_intermediate_products_equipment;
CREATE INDEX idx_intermediate_products_tank_id ON public.intermediate_products(tank_id);

-- 4. Update Audit Column Comment
COMMENT ON COLUMN public.intermediate_products.tank_id IS 'ID of the physical tank where this intermediate product is processed.';
