-- 1. CIP Executions: Refactor equipment linking
-- OLD: equipment_type (text), equipment_id (text)
-- NEW: equipment_id (UUID references equipments)

-- Step A: Add new column
ALTER TABLE public.cip_executions ADD COLUMN equipment_uid UUID REFERENCES public.equipments(id);

-- Step B: Try to backfill (Best effort matching by code)
UPDATE public.cip_executions cip
SET equipment_uid = eq.id
FROM public.equipments eq
WHERE cip.plant_id = eq.plant_id
  AND cip.equipment_id = eq.code; -- Assuming current 'equipment_id' stored CODE

-- Step C: Enforce Not Null (if data allows, otherwise leave nullable for now)
-- ALTER TABLE public.cip_executions ALTER COLUMN equipment_uid SET NOT NULL;

-- 2. Food Safety PCC Logs
-- OLD: equipment_id (text)
-- NEW: equipment_uid (UUID)
ALTER TABLE public.pcc_logs ADD COLUMN equipment_uid UUID REFERENCES public.equipments(id);

UPDATE public.pcc_logs pcc
SET equipment_uid = eq.id
FROM public.equipments eq
WHERE pcc.plant_id = eq.plant_id
  AND pcc.equipment_id = eq.code;

-- 3. Intermediate Products (Tanks)
-- In the database, 'intermediate_products' currently has 'code' ("Tank A").
-- We should register "Tank A" as an equipment of type 'tank'.

INSERT INTO public.equipments (organization_id, plant_id, name, code, equipment_type)
SELECT DISTINCT 
    organization_id, 
    plant_id, 
    code as name, 
    code, 
    'tank'
FROM public.intermediate_products
ON CONFLICT (plant_id, code) DO NOTHING;

-- 4. Cleanup (Optional: Drop old columns? Better keeping them as "legacy_code" for now or just drop if empty)
-- We will keep old columns for safety in this migration, identifying them as deprecated.
COMMENT ON COLUMN public.cip_executions.equipment_id IS 'DEPRECATED: Use equipment_uid';
COMMENT ON COLUMN public.pcc_logs.equipment_id IS 'DEPRECATED: Use equipment_uid';
