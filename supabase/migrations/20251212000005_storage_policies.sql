-- Storage RLS policies for coa-documents bucket
-- This creates policies on storage.objects table

-- Policy: Allow authenticated users to upload files to coa-documents
CREATE POLICY "Allow authenticated uploads to coa-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'coa-documents');

-- Policy: Allow authenticated users to update their files
CREATE POLICY "Allow authenticated updates to coa-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'coa-documents');

-- Policy: Allow public read access to coa-documents
CREATE POLICY "Allow public read from coa-documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coa-documents');

-- Policy: Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated deletes from coa-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'coa-documents');
