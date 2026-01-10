-- Fix for 42501 (Partial): Ensure lab_assets bucket and policies exist due to missing definition in migrations.

-- 1. Create Bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-assets',
  'lab-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/png','image/jpeg','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access lab-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert lab-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update lab-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete lab-assets" ON storage.objects;

-- 3. Create Policies

-- READ: Public
CREATE POLICY "Public Access lab-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'lab-assets' );

-- INSERT: Authenticated Users
CREATE POLICY "Authenticated Insert lab-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-assets' AND
  auth.role() = 'authenticated'
);

-- UPDATE: Owner only
CREATE POLICY "Authenticated Update lab-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lab-assets' AND
  auth.uid() = owner
);

-- DELETE: Owner only
CREATE POLICY "Authenticated Delete lab-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-assets' AND
  auth.uid() = owner
);
