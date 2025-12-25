-- 1. Remove NOT NULL constraint from organization_id
ALTER TABLE public.user_profiles ALTER COLUMN organization_id DROP NOT NULL;

-- 2. Add constraint to ensure non-system-owners MUST have an organization_id
-- and system_owners SHOULD NOT have one (based on the global management requirement)
ALTER TABLE public.user_profiles ADD CONSTRAINT check_system_owner_org 
CHECK (
    (role = 'system_owner' AND organization_id IS NULL) OR 
    (role != 'system_owner' AND organization_id IS NOT NULL)
);

-- 3. Update get_my_org_id helper to be null-safe
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 4. Update core RLS policies to handle NULL organization_id (system_owner bypass)
-- Note: Most policies use get_my_org_id(). If it returns null, standard policies won't match.
-- System owners will manage data via Server Actions with service role or specific SaaS-level policies.
