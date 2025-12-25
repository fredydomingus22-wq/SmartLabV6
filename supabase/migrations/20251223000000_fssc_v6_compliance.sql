-- Migration: FSSC 22000 v6 Compliance Modules
-- Description: Adds tables for TACCP, VACCP, Allergen Management, and Environmental Monitoring.

-- 1. Food Defense (TACCP)
CREATE TABLE public.taccp_assessments (
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
CREATE TABLE public.vaccp_vulnerabilities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    material_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    fraud_history_score integer CHECK (fraud_history_score BETWEEN 1 AND 5),
    economic_gain_potential integer CHECK (economic_gain_potential BETWEEN 1 AND 5),
    detection_ease_score integer CHECK (detection_ease_score BETWEEN 1 AND 5),
    vulnerability_score integer GENERATED ALWAYS AS (fraud_history_score * economic_gain_potential * detection_ease_score) STORED,
    mitigation_strategy text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Allergen Management
CREATE TABLE public.allergen_definitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.material_allergens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    allergen_id uuid NOT NULL REFERENCES public.allergen_definitions(id) ON DELETE CASCADE,
    is_ingredient boolean DEFAULT true,
    is_cross_contact_risk boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(material_id, allergen_id)
);

-- 4. Environmental Monitoring
CREATE TABLE public.environmental_zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    risk_level integer CHECK (risk_level BETWEEN 1 AND 4), -- Zone 1 (high risk) to 4 (low risk)
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sampling_points (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id uuid NOT NULL REFERENCES public.environmental_zones(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    frequency text, -- e.g., 'weekly', 'bi-weekly'
    last_swabbed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- RLS ENABLING
ALTER TABLE public.taccp_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccp_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sampling_points ENABLE ROW LEVEL SECURITY;

-- SIMPLE ORGANIZATION-BASED POLICIES (Assuming organization_id matches user profile)
CREATE POLICY "Users can view their organization's TACCP" ON public.taccp_assessments
    FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their organization's VACCP" ON public.vaccp_vulnerabilities
    FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- (Additional policies for INSERT/UPDATE would be needed, but start with SELECT)
