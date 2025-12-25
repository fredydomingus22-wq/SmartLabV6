-- product_specifications table to link Products <-> QA Parameters with Limits
-- This was identified as missing during Sprint 2 Planning for RPC logic.

CREATE TABLE public.product_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    
    product_id UUID NOT NULL REFERENCES public.products(id),
    qa_parameter_id UUID NOT NULL REFERENCES public.qa_parameters(id),
    
    min_value NUMERIC,
    max_value NUMERIC,
    target_value NUMERIC,
    text_value_expected TEXT, -- For qualitative tests like "Clear"
    
    is_critical BOOLEAN DEFAULT FALSE, -- e.g. CCP
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    
    UNIQUE(product_id, qa_parameter_id)
);

ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View Specs" ON public.product_specifications FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Manage Specs" ON public.product_specifications FOR ALL USING (
    organization_id = public.get_my_org_id() 
    AND 
    (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'qa_manager')))
);

-- Audit
CREATE TRIGGER audit_specs AFTER INSERT OR UPDATE OR DELETE ON public.product_specifications FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
