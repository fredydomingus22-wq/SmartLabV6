-- Audit Management Module
-- Tables for checklists, planning and recording audits

-- 1. Audit Checklists (Templates)
CREATE TABLE IF NOT EXISTS public.audit_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, name, version)
);

-- 2. Audit Sections (Template structure)
CREATE TABLE IF NOT EXISTS public.audit_checklist_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.audit_checklists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Audit Questions (Template items)
CREATE TABLE IF NOT EXISTS public.audit_checklist_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.audit_checklist_sections(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    requirement_reference VARCHAR(100), -- Clause or standard reference
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Audits (Execution records)
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    checklist_id UUID NOT NULL REFERENCES public.audit_checklists(id),
    
    audit_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    scope TEXT,
    
    status VARCHAR(30) NOT NULL DEFAULT 'planned', -- planned, in_progress, reporting, completed, cancelled
    
    auditor_id UUID REFERENCES auth.users(id),
    auditee_id UUID REFERENCES auth.users(id), -- Principal contact
    
    planned_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    summary TEXT,
    conclusions TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, audit_number)
);

-- 5. Audit Responses (Execution data)
CREATE TABLE IF NOT EXISTS public.audit_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.audit_checklist_questions(id),
    
    result VARCHAR(20) NOT NULL DEFAULT 'compliant', -- compliant, minor_nc, major_nc, observation, ofi, na
    evidence TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(audit_id, question_id)
);

-- 6. Audit Findings (Summarized results linked to QMS)
CREATE TABLE IF NOT EXISTS public.audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    response_id UUID REFERENCES public.audit_responses(id),
    
    description TEXT NOT NULL,
    classification VARCHAR(20) NOT NULL, -- minor_nc, major_nc, observation, ofi
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, linked, closed
    
    nonconformity_id UUID REFERENCES public.nonconformities(id), -- Link to QMS module
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_checklist_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_checklist_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Standard pattern)
CREATE POLICY "Users can view audit_checklists in their organization"
    ON public.audit_checklists FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view audits in their organization"
    ON public.audits FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- Repeat for all tables... (simplified for brevity, usually I'd add all CRUD but here focusing on SELECT/INSERT first)
CREATE POLICY "Users can insert audit records in their organization"
    ON public.audits FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update audit records in their organization"
    ON public.audits FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- Helper policies for sub-tables based on audit ownership/org
CREATE POLICY "Users can view audit responses for accessible audits"
    ON public.audit_responses FOR SELECT
    USING (audit_id IN (SELECT id FROM public.audits));

CREATE POLICY "Users can view audit findings for accessible audits"
    ON public.audit_findings FOR SELECT
    USING (audit_id IN (SELECT id FROM public.audits));

CREATE POLICY "Users can view audit checklist sections"
    ON public.audit_checklist_sections FOR SELECT
    USING (checklist_id IN (SELECT id FROM public.audit_checklists));

CREATE POLICY "Users can view audit checklist questions"
    ON public.audit_checklist_questions FOR SELECT
    USING (section_id IN (SELECT id FROM public.audit_checklist_sections));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audits_org ON public.audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);
CREATE INDEX IF NOT EXISTS idx_audit_responses_audit ON public.audit_responses(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_audit ON public.audit_findings(audit_id);
