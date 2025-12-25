-- Migration to unify RLS policies and standardize multi-tenancy access

-- 1. Helper Function for common role checks (simplifies policies)
CREATE OR REPLACE FUNCTION public.is_admin_or_manager() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'qa_manager', 'system_owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Standard Policies for product_history
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Standard SELECT product_history" ON public.product_history;
CREATE POLICY "Standard SELECT product_history" ON public.product_history 
FOR SELECT USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Standard INSERT product_history" ON public.product_history;
CREATE POLICY "Standard INSERT product_history" ON public.product_history 
FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

-- 3. Standard Policies for traceability_chain
ALTER TABLE public.traceability_chain ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Standard SELECT traceability_chain" ON public.traceability_chain;
CREATE POLICY "Standard SELECT traceability_chain" ON public.traceability_chain 
FOR SELECT USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Standard INSERT traceability_chain" ON public.traceability_chain;
CREATE POLICY "Standard INSERT traceability_chain" ON public.traceability_chain 
FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

-- 4. Standard Policies for batch_packaging_usage (filling gaps)
DROP POLICY IF EXISTS "Standard UPDATE batch_packaging_usage" ON public.batch_packaging_usage;
CREATE POLICY "Standard UPDATE batch_packaging_usage" ON public.batch_packaging_usage 
FOR UPDATE USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Standard DELETE batch_packaging_usage" ON public.batch_packaging_usage;
CREATE POLICY "Standard DELETE batch_packaging_usage" ON public.batch_packaging_usage 
FOR DELETE USING (organization_id = public.get_my_org_id());

-- 5. Standard Policies for packaging_materials & lots (viewing is selective, management restricted)
DROP POLICY IF EXISTS "Standard ALL packaging_materials" ON public.packaging_materials;
CREATE POLICY "Standard ALL packaging_materials" ON public.packaging_materials 
FOR ALL USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Standard ALL packaging_lots" ON public.packaging_lots;
CREATE POLICY "Standard ALL packaging_lots" ON public.packaging_lots 
FOR ALL USING (organization_id = public.get_my_org_id());

-- 6. Ensure plants and organizations are viewable by those inside the org
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations 
FOR SELECT USING (id = public.get_my_org_id() OR public.is_system_owner());

DROP POLICY IF EXISTS "Standard SELECT plants" ON public.plants;
CREATE POLICY "Standard SELECT plants" ON public.plants 
FOR SELECT USING (organization_id = public.get_my_org_id() OR public.is_system_owner());

-- 7. Specific Case: user_profiles
-- Admins should be able to look up users in their org to assign tasks/training
DROP POLICY IF EXISTS "Admins can insert user_profiles" ON public.user_profiles;
CREATE POLICY "Admins can insert user_profiles" ON public.user_profiles 
FOR INSERT WITH CHECK (public.is_admin_or_manager() AND organization_id = public.get_my_org_id());
