-- Add COA file storage support to raw_material_lots

-- Add column for storing COA file URL/path
ALTER TABLE public.raw_material_lots
    ADD COLUMN coa_file_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.raw_material_lots.coa_file_url IS 'URL/path to uploaded Certificate of Analysis file in Supabase Storage';

-- Note: You need to create a Storage bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "coa-documents"
-- 3. Set it as public or configure RLS as needed
-- 4. Enable file upload for authenticated users
