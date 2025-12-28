-- Safely fix policies for audit-evidence bucket

-- 1. Drop existing policies to avoid conflicts (clean slate for this bucket)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Audit Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Upload Audit Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Update/Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Update Audit Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Delete Audit Evidence" ON storage.objects;

-- 2. Enhance bucket configuration (ensure it exists and is public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-evidence', 'audit-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Re-create Policies correctly

-- A. Public Read Access
CREATE POLICY "Public Read Audit Evidence"
ON storage.objects FOR SELECT
USING ( bucket_id = 'audit-evidence' );

-- B. Authenticated Upload
CREATE POLICY "Auth Upload Audit Evidence"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'audit-evidence' 
    AND auth.role() = 'authenticated'
);

-- C. Authenticated Update
CREATE POLICY "Auth Update Audit Evidence"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'audit-evidence' 
    AND auth.role() = 'authenticated'
);

-- D. Authenticated Delete
CREATE POLICY "Auth Delete Audit Evidence"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'audit-evidence' 
    AND auth.role() = 'authenticated'
);
