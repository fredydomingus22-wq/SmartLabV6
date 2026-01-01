-- Add training control fields to Documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS requires_training BOOLEAN DEFAULT FALSE;

-- Add training gating status to Versions
-- 'pending_training_setup' -> 'training_ready' -> 'published'
ALTER TABLE public.document_versions
ADD COLUMN IF NOT EXISTS training_status VARCHAR(50) DEFAULT 'none'; -- none, pending_setup, ready, active
