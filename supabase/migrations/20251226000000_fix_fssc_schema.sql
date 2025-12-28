-- Migration: Fix FSSC v6 Schema (Tables missing due to migration failure)
-- Re-creates tables with correct columns (including organization_id and plant_id for RLS)

-- 1. Food Defense (TACCP)
CREATE TABLE IF NOT EXISTS public.taccp_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES public.plants(id) ON DELETE SET NULL,
    area_name text NOT NULL,
    threat_description text,
    threat_type text CHECK (threat_type IN ('cyber', 'physical_outside', 'physical_inside', 'supply_chain')),
    likelihood integer CHECK (likelihood BETWEEN 1 AND 5),
    consequence integer CHECK (consequence BETWEEN 1 AND 5),
    risk_score integer GENERATED ALWAYS AS (likelihood * consequence) STORED,
    mitigation_measures text,
    responsible_id uuid REFERENCES auth.users(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'review_pending', 'retired')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Food Fraud (VACCP)
-- Fixed: references raw_materials, adds plant_id
CREATE TABLE IF NOT EXISTS public.vaccp_vulnerabilities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES public.plants(id) ON DELETE SET NULL,
    material_id uuid REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    fraud_history_score integer CHECK (fraud_history_score BETWEEN 1 AND 5),
    economic_gain_potential integer CHECK (economic_gain_potential BETWEEN 1 AND 5),
    detection_ease_score integer CHECK (detection_ease_score BETWEEN 1 AND 5),
    vulnerability_score integer GENERATED ALWAYS AS (fraud_history_score * economic_gain_potential * detection_ease_score) STORED,
    mitigation_strategy text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Allergen Management
-- Fixed: adds organization_id and plant_id
CREATE TABLE IF NOT EXISTS public.allergen_definitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES public.plants(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, name)
);

-- Fixed: references raw_materials, adds organization_id and plant_id
CREATE TABLE IF NOT EXISTS public.material_allergens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES public.plants(id) ON DELETE SET NULL,
    material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    allergen_id uuid NOT NULL REFERENCES public.allergen_definitions(id) ON DELETE CASCADE,
    is_ingredient boolean DEFAULT true,
    is_cross_contact_risk boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(material_id, allergen_id)
);

-- 4. Environmental Monitoring (Zones)
-- Fixed: adds plant_id
CREATE TABLE IF NOT EXISTS public.environmental_zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES public.plants(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    risk_level integer CHECK (risk_level BETWEEN 1 AND 4),
    created_at timestamptz DEFAULT now()
);

-- 5. Modify existing sampling_points to support Environmental Monitoring
DO $$
BEGIN
    -- Add zone_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sampling_points' AND column_name = 'zone_id') THEN
        ALTER TABLE public.sampling_points ADD COLUMN zone_id uuid REFERENCES public.environmental_zones(id) ON DELETE CASCADE;
    END IF;

    -- Add frequency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sampling_points' AND column_name = 'frequency') THEN
        ALTER TABLE public.sampling_points ADD COLUMN frequency text;
    END IF;

    -- Add last_swabbed_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sampling_points' AND column_name = 'last_swabbed_at') THEN
        ALTER TABLE public.sampling_points ADD COLUMN last_swabbed_at timestamptz;
    END IF;
END $$;

-- Enable RLS for new tables
ALTER TABLE public.taccp_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccp_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_zones ENABLE ROW LEVEL SECURITY;

-- Apply Multi-Level RLS (Copied from 20251223000007_fssc_rls_fix.sql)
-- We re-run this to ensure new tables get the policies
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
        -- Enable RLS (Already done but harmless to repeat)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Standard SELECT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard INSERT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard UPDATE" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard DELETE" ON public.%I', t);
        
        -- Create new multi-level policies
        -- Using get_my_org_id() and get_my_plant_id()
        
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
