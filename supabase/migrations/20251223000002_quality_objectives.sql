-- Quality Objectives Module (ISO 9001:2015 Clause 6.2)
-- Migration: 20251223000002_quality_objectives.sql

-- 1. Create quality_objectives table
CREATE TABLE IF NOT EXISTS public.quality_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'process' CHECK (category IN ('process', 'customer', 'product', 'compliance', 'financial', 'people')),
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '%',
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'achieved', 'missed')),
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.quality_objectives ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Objectives visible to organization"
    ON public.quality_objectives FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Objectives insert by organization"
    ON public.quality_objectives FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Objectives update by organization"
    ON public.quality_objectives FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Objectives delete by organization"
    ON public.quality_objectives FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_quality_objectives_org ON public.quality_objectives(organization_id);
CREATE INDEX IF NOT EXISTS idx_quality_objectives_status ON public.quality_objectives(status);
CREATE INDEX IF NOT EXISTS idx_quality_objectives_target_date ON public.quality_objectives(target_date);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_quality_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS quality_objectives_updated_at ON public.quality_objectives;
CREATE TRIGGER quality_objectives_updated_at
    BEFORE UPDATE ON public.quality_objectives
    FOR EACH ROW
    EXECUTE FUNCTION update_quality_objectives_updated_at();
