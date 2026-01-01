-- Add Training linkage to CAPA Actions
ALTER TABLE public.capa_actions 
ADD COLUMN IF NOT EXISTS training_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS training_module_id UUID REFERENCES public.training_modules(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_capa_training_module ON public.capa_actions(training_module_id);

-- CAPA Attachments table
CREATE TABLE IF NOT EXISTS public.capa_actions_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    capa_action_id UUID NOT NULL REFERENCES public.capa_actions(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes INTEGER,
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for attachments
CREATE INDEX IF NOT EXISTS idx_capa_attachments_action ON public.capa_actions_attachments(capa_action_id);
CREATE INDEX IF NOT EXISTS idx_capa_attachments_org ON public.capa_actions_attachments(organization_id);

-- RLS for capa_actions_attachments
ALTER TABLE public.capa_actions_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capa_attachments_select" ON public.capa_actions_attachments
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "capa_attachments_insert" ON public.capa_actions_attachments
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "capa_attachments_delete" ON public.capa_actions_attachments
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );
