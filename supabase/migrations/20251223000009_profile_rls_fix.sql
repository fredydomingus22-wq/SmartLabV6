-- Fix RLS for user_profiles to allow Admins and QA Managers to update profiles in their org
-- This resolves the issue where a Tenant Admin was blocked from managing their team.

-- First, drop the overly restrictive policy if we want to replace it or just add a new one.
-- Postgres permissive policies are ORed, so adding a new one is sufficient.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update profiles in their organization') THEN
        CREATE POLICY "Admins can update profiles in their organization"
        ON public.user_profiles
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() 
                AND role IN ('admin', 'qa_manager', 'system_owner')
                AND organization_id = public.user_profiles.organization_id
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() 
                AND role IN ('admin', 'qa_manager', 'system_owner')
                AND organization_id = public.user_profiles.organization_id
            )
        );
    END IF;
END $$;

-- Also ensure system_owner can view all profiles for global management (if using standard client)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System Owners can view all profiles') THEN
        CREATE POLICY "System Owners can view all profiles"
        ON public.user_profiles
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() AND role = 'system_owner'
            )
        );
    END IF;
END $$;
