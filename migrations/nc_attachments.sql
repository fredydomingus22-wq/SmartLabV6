-- Migration: NC Attachments & Storage

-- 1. Create Storage Bucket for NC Evidence if it doesn't exist
-- Note: This usually needs to be done via Supabase Dashboard or API, 
-- but we include it here for reference and potential automation.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nc-evidence', 'nc-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create nc_attachments table
CREATE TABLE IF NOT EXISTS public.nc_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    nonconformity_id UUID NOT NULL REFERENCES public.nonconformities(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- 3. Enable RLS
ALTER TABLE public.nc_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Users can view attachments for their organization" 
ON public.nc_attachments FOR SELECT 
USING (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can upload attachments for their organization" 
ON public.nc_attachments FOR INSERT 
WITH CHECK (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own or their organization's attachments" 
ON public.nc_attachments FOR DELETE 
USING (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 5. Storage Policies for 'nc-evidence' bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'nc-evidence');

CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'nc-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'nc-evidence' AND auth.role() = 'authenticated');
