-- Production Module - RLS INSERT/UPDATE Policies
-- This migration adds missing INSERT and UPDATE policies for production tables

-- Production Lines - INSERT/UPDATE
CREATE POLICY "Users can insert lines in their org" ON public.production_lines 
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update lines in their org" ON public.production_lines 
    FOR UPDATE USING (organization_id = public.get_my_org_id());

-- Products - INSERT/UPDATE
CREATE POLICY "Users can insert products in their org" ON public.products 
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update products in their org" ON public.products 
    FOR UPDATE USING (organization_id = public.get_my_org_id());

-- Production Batches - INSERT/UPDATE
CREATE POLICY "Users can insert batches in their org" ON public.production_batches 
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update batches in their org" ON public.production_batches 
    FOR UPDATE USING (organization_id = public.get_my_org_id());

-- Intermediate Products - INSERT/UPDATE
CREATE POLICY "Users can insert intermediate in their org" ON public.intermediate_products 
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update intermediate in their org" ON public.intermediate_products 
    FOR UPDATE USING (organization_id = public.get_my_org_id());

-- Intermediate Ingredients - INSERT/UPDATE
CREATE POLICY "Users can insert ingredients in their org" ON public.intermediate_ingredients 
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update ingredients in their org" ON public.intermediate_ingredients 
    FOR UPDATE USING (organization_id = public.get_my_org_id());
