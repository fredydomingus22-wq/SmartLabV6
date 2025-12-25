-- 1. Create Unified Equipment Table
CREATE TABLE public.equipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- "L01", "T05", "INC-01"
    description TEXT,
    
    equipment_type TEXT NOT NULL CHECK (equipment_type IN ('production_line', 'tank', 'incubator', 'filler', 'mixer', 'other')),
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'decommissioned')),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(plant_id, code)
);
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- 2. Migrate existing specialized entities to equipments
-- Existing: production_lines, micro_incubators.
-- Future: intermediate_products (Tanks) are slightly different (they are contents of a tank?), but 'tanks' physically are equipments.

-- 2A. Migrate Production Lines
INSERT INTO public.equipments (id, organization_id, plant_id, name, code, equipment_type, status)
SELECT id, organization_id, plant_id, name, code, 'production_line', status::text
FROM public.production_lines
ON CONFLICT (plant_id, code) DO NOTHING;

-- 2B. Migrate Incubators (Assuming they have unique codes? They have 'name'. We might need to slugify name for code)
INSERT INTO public.equipments (id, organization_id, plant_id, name, code, equipment_type, status)
SELECT 
    id, 
    organization_id, 
    plant_id, 
    name, 
    regexp_replace(upper(name), '\s+', '-', 'g'), -- Generate basic code from name
    'incubator', 
    status::text
FROM public.micro_incubators
ON CONFLICT (plant_id, code) DO NOTHING;

-- 3. Modify Specialized Tables to Reference Equipment (Optional but verifies integrity)
-- We keep specialized tables if they have extra columns (like setpoint_temp_c for incubators).
-- Ideally, we add 'equipment_id' FK to them and Drop redundant columns later, 
-- BUT for now, we just ensure the Master Table exists for CIP/FoodSafety FKs.

-- Policies
CREATE POLICY "View Equipments" ON public.equipments FOR SELECT USING (organization_id = public.get_my_org_id());

-- Audit
CREATE TRIGGER audit_equipments AFTER INSERT OR UPDATE OR DELETE ON public.equipments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
