-- 20251227000002_asset_traceability_fix.sql
-- Add equipment_id to lab_analysis for ISO 17025 traceability

-- 1. Add column
ALTER TABLE public.lab_analysis 
ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.lab_analysis.equipment_id IS 'Traceability: The equipment used to perform this analysis (ISO 17025 requirement).';

-- 3. Update existing RLS (if needed, but usually inheriting from table is fine)
-- lab_analysis already has organization_id based protection.

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_lab_analysis_equipment ON public.lab_analysis(equipment_id);
