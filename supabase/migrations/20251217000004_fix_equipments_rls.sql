-- Fix Equipments RLS Policies
-- The initial combined equipment migration (20251211000011_unified_equipment.sql) only added a SELECT policy.
-- This migration adds the missing INSERT, UPDATE, and DELETE policies to allow management of equipments.
-- We drop existing policies first to ensure idempotency and correct definitions.

-- INSERT Policy
DROP POLICY IF EXISTS "Users can insert equipments in their org" ON public.equipments;
CREATE POLICY "Users can insert equipments in their org" ON public.equipments
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

-- UPDATE Policy
DROP POLICY IF EXISTS "Users can update equipments in their org" ON public.equipments;
CREATE POLICY "Users can update equipments in their org" ON public.equipments
    FOR UPDATE USING (organization_id = public.get_my_org_id());

-- DELETE Policy
DROP POLICY IF EXISTS "Users can delete equipments in their org" ON public.equipments;
CREATE POLICY "Users can delete equipments in their org" ON public.equipments
    FOR DELETE USING (organization_id = public.get_my_org_id());
