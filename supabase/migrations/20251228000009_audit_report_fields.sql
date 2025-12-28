-- Add professional audit report fields to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS audit_objective TEXT,
ADD COLUMN IF NOT EXISTS executive_summary TEXT;

-- Update RLS if necessary (usually not needed if table policies use organization_id)
