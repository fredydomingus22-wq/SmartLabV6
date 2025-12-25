-- Fix Microbiology RLS Policies
-- The initial micro migration only added SELECT policies.
-- This migration adds the missing INSERT, UPDATE, and DELETE policies.

-- 1. Micro Incubators
DROP POLICY IF EXISTS "Users can insert incubators in their org" ON public.micro_incubators;
CREATE POLICY "Users can insert incubators in their org" ON public.micro_incubators
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can update incubators in their org" ON public.micro_incubators;
CREATE POLICY "Users can update incubators in their org" ON public.micro_incubators
    FOR UPDATE USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can delete incubators in their org" ON public.micro_incubators;
CREATE POLICY "Users can delete incubators in their org" ON public.micro_incubators
    FOR DELETE USING (organization_id = public.get_my_org_id());

-- 2. Micro Media Types
DROP POLICY IF EXISTS "Users can insert media types in their org" ON public.micro_media_types;
CREATE POLICY "Users can insert media types in their org" ON public.micro_media_types
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can update media types in their org" ON public.micro_media_types;
CREATE POLICY "Users can update media types in their org" ON public.micro_media_types
    FOR UPDATE USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can delete media types in their org" ON public.micro_media_types;
CREATE POLICY "Users can delete media types in their org" ON public.micro_media_types
    FOR DELETE USING (organization_id = public.get_my_org_id());

-- 3. Micro Media Lots
DROP POLICY IF EXISTS "Users can insert media lots in their org" ON public.micro_media_lots;
CREATE POLICY "Users can insert media lots in their org" ON public.micro_media_lots
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can update media lots in their org" ON public.micro_media_lots;
CREATE POLICY "Users can update media lots in their org" ON public.micro_media_lots
    FOR UPDATE USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can delete media lots in their org" ON public.micro_media_lots;
CREATE POLICY "Users can delete media lots in their org" ON public.micro_media_lots
    FOR DELETE USING (organization_id = public.get_my_org_id());

-- 4. Micro Test Sessions
DROP POLICY IF EXISTS "Users can insert sessions in their org" ON public.micro_test_sessions;
CREATE POLICY "Users can insert sessions in their org" ON public.micro_test_sessions
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can update sessions in their org" ON public.micro_test_sessions;
CREATE POLICY "Users can update sessions in their org" ON public.micro_test_sessions
    FOR UPDATE USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can delete sessions in their org" ON public.micro_test_sessions;
CREATE POLICY "Users can delete sessions in their org" ON public.micro_test_sessions
    FOR DELETE USING (organization_id = public.get_my_org_id());

-- 5. Micro Results
DROP POLICY IF EXISTS "Users can insert results in their org" ON public.micro_results;
CREATE POLICY "Users can insert results in their org" ON public.micro_results
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can update results in their org" ON public.micro_results;
CREATE POLICY "Users can update results in their org" ON public.micro_results
    FOR UPDATE USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Users can delete results in their org" ON public.micro_results;
CREATE POLICY "Users can delete results in their org" ON public.micro_results
    FOR DELETE USING (organization_id = public.get_my_org_id());
