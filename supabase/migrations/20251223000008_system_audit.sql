-- Create System Audit Logs table for Global SaaS Actions
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_system_audit_actor ON system_audit_logs(actor_id);
CREATE INDEX idx_system_audit_action ON system_audit_logs(action);
CREATE INDEX idx_system_audit_created ON system_audit_logs(created_at);

-- RLS: Only System Owner can read these logs
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System Owners can view all audit logs"
    ON system_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'system_owner'
        )
    );

-- No one can update or delete audit logs (immutability)
CREATE POLICY "Deny all updates to audit logs"
    ON system_audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Deny all deletes to audit logs"
    ON system_audit_logs
    FOR DELETE
    USING (false);
