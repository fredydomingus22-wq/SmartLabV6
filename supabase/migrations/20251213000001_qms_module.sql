-- QMS Module: Nonconformities and CAPA
-- This migration creates tables for quality management system

-- Nonconformities table (NC reports)
CREATE TABLE IF NOT EXISTS public.nonconformities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    
    -- NC identification
    nc_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classification
    nc_type VARCHAR(50) NOT NULL DEFAULT 'internal', -- internal, supplier, customer, audit
    severity VARCHAR(20) NOT NULL DEFAULT 'minor', -- minor, major, critical
    category VARCHAR(100), -- product, process, documentation, equipment, etc.
    
    -- Source/Origin
    source_type VARCHAR(50), -- batch, lot, sample, audit, complaint
    source_id UUID, -- Reference to the source entity
    source_reference VARCHAR(100), -- Human-readable reference
    
    -- Status tracking
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- open, under_investigation, containment, corrective_action, verification, closed
    
    -- Dates
    detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_date DATE,
    due_date DATE,
    
    -- People
    detected_by UUID REFERENCES auth.users(id),
    responsible_id UUID REFERENCES auth.users(id),
    
    -- Attachments and notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, nc_number)
);

-- CAPA (Corrective and Preventive Actions)
CREATE TABLE IF NOT EXISTS public.capa_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    nonconformity_id UUID REFERENCES public.nonconformities(id) ON DELETE CASCADE,
    
    -- Action identification
    action_number VARCHAR(50) NOT NULL,
    action_type VARCHAR(20) NOT NULL DEFAULT 'corrective', -- corrective, preventive, containment
    
    -- Description
    description TEXT NOT NULL,
    root_cause TEXT,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, verified, closed
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    -- Dates
    planned_date DATE,
    completed_date DATE,
    verified_date DATE,
    
    -- People
    responsible_id UUID REFERENCES auth.users(id),
    verified_by UUID REFERENCES auth.users(id),
    
    -- Effectiveness
    effectiveness_verified BOOLEAN DEFAULT FALSE,
    effectiveness_notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, action_number)
);

-- 8D Report (for structured problem solving)
CREATE TABLE IF NOT EXISTS public.eight_d_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    nonconformity_id UUID REFERENCES public.nonconformities(id) ON DELETE CASCADE,
    
    -- 8D identification
    report_number VARCHAR(50) NOT NULL,
    
    -- D1: Team
    team_members TEXT[], -- Array of team member names/IDs
    champion VARCHAR(255),
    
    -- D2: Problem Description
    problem_description TEXT,
    is_5w2h_complete BOOLEAN DEFAULT FALSE,
    
    -- D3: Containment Actions
    containment_actions TEXT,
    containment_verified BOOLEAN DEFAULT FALSE,
    
    -- D4: Root Cause Analysis
    root_cause_analysis TEXT,
    root_cause_method VARCHAR(50), -- 5why, fishbone, pareto, etc.
    
    -- D5: Permanent Corrective Actions
    corrective_actions TEXT,
    
    -- D6: Implementation
    implementation_plan TEXT,
    implementation_date DATE,
    
    -- D7: Prevent Recurrence
    preventive_actions TEXT,
    systemic_changes TEXT,
    
    -- D8: Congratulate Team
    lessons_learned TEXT,
    recognition_notes TEXT,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- open, in_progress, completed, closed
    current_step INT DEFAULT 1, -- 1-8
    
    -- Dates
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_date DATE,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, report_number)
);

-- Enable RLS
ALTER TABLE public.nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eight_d_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nonconformities
CREATE POLICY "Users can view nonconformities in their organization"
    ON public.nonconformities FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert nonconformities in their organization"
    ON public.nonconformities FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update nonconformities in their organization"
    ON public.nonconformities FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

-- RLS Policies for capa_actions
CREATE POLICY "Users can view capa_actions in their organization"
    ON public.capa_actions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert capa_actions in their organization"
    ON public.capa_actions FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update capa_actions in their organization"
    ON public.capa_actions FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

-- RLS Policies for eight_d_reports
CREATE POLICY "Users can view eight_d_reports in their organization"
    ON public.eight_d_reports FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert eight_d_reports in their organization"
    ON public.eight_d_reports FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update eight_d_reports in their organization"
    ON public.eight_d_reports FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nonconformities_org ON public.nonconformities(organization_id);
CREATE INDEX IF NOT EXISTS idx_nonconformities_status ON public.nonconformities(status);
CREATE INDEX IF NOT EXISTS idx_nonconformities_detected ON public.nonconformities(detected_date);
CREATE INDEX IF NOT EXISTS idx_capa_actions_nc ON public.capa_actions(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_capa_actions_status ON public.capa_actions(status);
CREATE INDEX IF NOT EXISTS idx_eight_d_nc ON public.eight_d_reports(nonconformity_id);
