-- Fix for Lab Assets Document Persistence
-- Create a table to link uploaded files in 'lab-assets' bucket to lab_assets records.

CREATE TABLE IF NOT EXISTS public.lab_asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.lab_assets(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Original filename
    path TEXT NOT NULL, -- Storage path
    file_type TEXT,
    size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lab_asset_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view asset documents"
ON public.lab_asset_documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.lab_assets a
        WHERE a.id = lab_asset_documents.asset_id
        AND a.organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert asset documents"
ON public.lab_asset_documents FOR INSERT
WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
        SELECT 1 FROM public.lab_assets a
        WHERE a.id = asset_id
        AND a.organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete own documents"
ON public.lab_asset_documents FOR DELETE
USING (auth.uid() = uploaded_by);
