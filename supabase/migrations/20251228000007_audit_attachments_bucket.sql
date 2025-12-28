-- Create audit-evidence bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-evidence', 'audit-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access (specific to audit-evidence)
CREATE POLICY "Public Access Audit Evidence"
ON storage.objects FOR SELECT
USING ( bucket_id = 'audit-evidence' );

-- Policy: Allow authenticated users to upload
CREATE POLICY "Authenticated Users Upload Audit Evidence"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'audit-evidence' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update
CREATE POLICY "Authenticated Users Update Audit Evidence"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'audit-evidence' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Authenticated Users Delete Audit Evidence"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'audit-evidence' 
    AND auth.role() = 'authenticated'
);
