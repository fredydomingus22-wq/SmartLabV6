-- Migration: Food Safety Phase 1 - Integrity & Traceability
-- Description: Adds batch linkage to PCC logs and introduces HACCP Plan Versioning.

-- 1. Link PCC Logs to Production Batches (Traceability)
ALTER TABLE public.pcc_logs
ADD COLUMN production_batch_id UUID REFERENCES public.production_batches(id);

CREATE INDEX idx_pcc_logs_production_batch_id ON public.pcc_logs(production_batch_id);

-- 2. HACCP Plan Versioning (Change Management)
CREATE TABLE public.haccp_plan_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID REFERENCES public.plants(id),
    
    version_number TEXT NOT NULL, -- e.g. "1.0", "2.0", "Draft-2025-01"
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'archived')),
    
    effective_date DATE,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    changes_summary TEXT, -- Description of changes in this version
    plan_snapshot JSONB, -- Full snapshot of the Hazards/CCP tree at approval time
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.haccp_plan_versions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View HACCP Versions" ON public.haccp_plan_versions
    FOR SELECT USING (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Create/Edit HACCP Drafts" ON public.haccp_plan_versions
    FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Update HACCP Versions" ON public.haccp_plan_versions
    FOR UPDATE USING (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));
