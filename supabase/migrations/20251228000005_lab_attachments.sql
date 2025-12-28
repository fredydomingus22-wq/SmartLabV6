-- Add attachment_url column to SAMPLES table for single-form evidence
ALTER TABLE samples ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create storage bucket for lab attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-attachments', 'lab-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for lab-attachments bucket
DROP POLICY IF EXISTS "Authenticated users can upload lab attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload lab attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lab-attachments');

DROP POLICY IF EXISTS "Authenticated users can view lab attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view lab attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lab-attachments');

DROP POLICY IF EXISTS "Authenticated users can update lab attachments" ON storage.objects;
CREATE POLICY "Authenticated users can update lab attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lab-attachments');

DROP POLICY IF EXISTS "Authenticated users can delete lab attachments" ON storage.objects;
CREATE POLICY "Authenticated users can delete lab attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lab-attachments');
