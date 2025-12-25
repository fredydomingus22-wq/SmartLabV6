-- QMS Phase 2: Attachments and Audit Trail
-- Migration for NC attachments and audit log

-- NC Attachments table
CREATE TABLE IF NOT EXISTS public.nc_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    nonconformity_id UUID NOT NULL REFERENCES public.nonconformities(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes INTEGER,
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- QMS Audit Log table
CREATE TABLE IF NOT EXISTS public.qms_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nc_attachments_nc ON public.nc_attachments(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_nc_attachments_org ON public.nc_attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_qms_audit_entity ON public.qms_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_qms_audit_org ON public.qms_audit_log(organization_id);

-- RLS for nc_attachments
ALTER TABLE public.nc_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_attachments_select" ON public.nc_attachments
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "nc_attachments_insert" ON public.nc_attachments
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "nc_attachments_delete" ON public.nc_attachments
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- RLS for qms_audit_log
ALTER TABLE public.qms_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qms_audit_select" ON public.qms_audit_log
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "qms_audit_insert" ON public.qms_audit_log
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );
