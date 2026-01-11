-- Migration: Fix RLS for Sampling System,
-- Date: 2026-01-10
-- Description: Adds missing CRUD policies for production_sampling_plans and sample_requests.

-- 1. production_sampling_plans
DROP POLICY IF EXISTS "Users can view sampling plans in their org" ON public.production_sampling_plans;
-- Recreate with full access for org members (conceptually, usually we'd restrict write to admins/managers, but for now matching the request context "new row violates")

CREATE POLICY "Users can select sampling plans" ON public.production_sampling_plans
    FOR SELECT USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can insert sampling plans" ON public.production_sampling_plans
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

CREATE POLICY "Users can update sampling plans" ON public.production_sampling_plans
    FOR UPDATE USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can delete sampling plans" ON public.production_sampling_plans
    FOR DELETE USING (organization_id = public.get_my_org_id());

-- 2. sample_requests (Ensuring full access for now as well)
DROP POLICY IF EXISTS "Users can view sample requests in their org" ON public.sample_requests;

CREATE POLICY "Users can select sample requests" ON public.sample_requests
    FOR SELECT USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can insert sample requests" ON public.sample_requests
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

CREATE POLICY "Users can update sample requests" ON public.sample_requests
    FOR UPDATE USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can delete sample requests" ON public.sample_requests
    FOR DELETE USING (organization_id = public.get_my_org_id());
