-- Migration: FSSC v6 RLS & Schema Fixes
-- Description: Adds missing plant_id/organization_id columns and applies multi-level RLS policies to FSSC tables.

BEGIN;

-- 1. Schema Enhancements for Sampling Points
-- Add organization_id and plant_id to sampling_points for direct RLS enforcement
ALTER TABLE public.sampling_points ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.sampling_points ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES public.plants(id);

-- Backfill from zones
UPDATE public.sampling_points sp
SET organization_id = ez.organization_id
FROM public.environmental_zones ez
WHERE sp.zone_id = ez.id AND sp.organization_id IS NULL;

-- 2. Schema Enhancements for Environmental Zones
ALTER TABLE public.environmental_zones ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES public.plants(id);

-- 3. Schema Enhancements for VACCP
ALTER TABLE public.vaccp_vulnerabilities ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES public.plants(id);

-- 4. Schema Enhancements for Allergen Definitions (Make them per-org for consistency)
ALTER TABLE public.allergen_definitions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
-- Note: Since it was unique by name, if multiple orgs want the same name, we need to change the constraint
ALTER TABLE public.allergen_definitions DROP CONSTRAINT IF EXISTS allergen_definitions_name_key;
ALTER TABLE public.allergen_definitions ADD CONSTRAINT allergen_definitions_org_name_key UNIQUE(organization_id, name);

-- 5. Junction Tables RLS (Allergens)
ALTER TABLE public.material_allergens ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.material_allergens ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES public.plants(id);

-- 6. Apply Multi-Level RLS Policies
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'taccp_assessments', 
        'vaccp_vulnerabilities', 
        'environmental_zones', 
        'sampling_points',
        'allergen_definitions',
        'material_allergens'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Standard SELECT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard INSERT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard UPDATE" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard DELETE" ON public.%I', t);
        
        -- Create new multi-level policies
        EXECUTE format('CREATE POLICY "Standard SELECT" ON public.%I FOR SELECT USING (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
        
        EXECUTE format('CREATE POLICY "Standard INSERT" ON public.%I FOR INSERT WITH CHECK (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
        
        EXECUTE format('CREATE POLICY "Standard UPDATE" ON public.%I FOR UPDATE USING (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        ) WITH CHECK (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
        
        EXECUTE format('CREATE POLICY "Standard DELETE" ON public.%I FOR DELETE USING (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
    END LOOP;
END $$;

COMMIT;
