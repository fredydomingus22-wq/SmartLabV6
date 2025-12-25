-- Reporting Module: Generated Reports Table
-- Tracks all generated reports for audit trail

CREATE TABLE IF NOT EXISTS public.generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('coa', 'batch_report', 'micro_report', 'qc_summary')),
    entity_type VARCHAR(50), -- 'sample', 'batch', 'micro_session'
    entity_id UUID, -- Reference to sample, batch, or session
    report_number VARCHAR(50) NOT NULL,
    title TEXT,
    report_data JSONB, -- Cached report data at generation time
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'signed', 'voided')),
    signed_by UUID REFERENCES auth.users(id),
    signed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_reports_org ON public.generated_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON public.generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_entity ON public.generated_reports(entity_type, entity_id);

-- RLS
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_reports_select" ON public.generated_reports
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "generated_reports_insert" ON public.generated_reports
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "generated_reports_update" ON public.generated_reports
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );
