-- Fix for 42501: Missing INSERT policy for audit_events
-- By default, checking "ENABLE ROW LEVEL SECURITY" blocks all operations not explicitly permitted.

CREATE POLICY "Users can insert audit events for their org"
ON public.audit_events FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    organization_id IN (
        SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    )
);
