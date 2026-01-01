-- Unified Audit Foundation & DMS Stabilization
-- ALCOA+ Compliance: Attributable, Legible, Contemporaneous, Original, Accurate

-- 1. DMS Schema Stabilization
-- Ensure missing columns exist to prevent "Object not found" in schema cache
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS requires_training BOOLEAN DEFAULT FALSE;

ALTER TABLE public.document_versions
ADD COLUMN IF NOT EXISTS training_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100); -- For better preview detection

-- 2. Universal Audit Engine Table
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    event_type VARCHAR(50) NOT NULL, -- e.g., 'DOCUMENT_PUBLISHED', 'SAMPLE_RESULT_REGISTERED'
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'documents', 'samples', 'training_modules'
    entity_id UUID NOT NULL,
    
    payload JSONB NOT NULL DEFAULT '{}', -- Snapshot of changes: { "old": ..., "new": ... }
    metadata JSONB NOT NULL DEFAULT '{}', -- { "ip": ..., "user_agent": ..., "trace_id": ... }
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Audit Engine Indices for Performance
CREATE INDEX IF NOT EXISTS idx_audit_org_event ON public.audit_events (organization_id, event_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_events (created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Industrial Standard: Read-only for Auditors/Admins)
-- Simple policy for current multi-tenancy layer
CREATE POLICY "Users can view audit events in their org"
ON public.audit_events FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    )
);

-- Note: No UPDATE or DELETE policies. Audit events are IMMUTABLE.
