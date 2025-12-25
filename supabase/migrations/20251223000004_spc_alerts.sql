-- SPC Alerts: Track statistical violations and Cpk threshold breaches
CREATE TABLE IF NOT EXISTS public.spc_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    
    -- What triggered the alert
    alert_type TEXT NOT NULL CHECK (alert_type IN ('run_rule_violation', 'cpk_warning', 'cpk_critical', 'out_of_spec')),
    rule_number INTEGER, -- For run_rule_violation: which rule (1-5)
    
    -- Context
    qa_parameter_id UUID NOT NULL REFERENCES public.qa_parameters(id),
    sample_id UUID REFERENCES public.samples(id),
    lab_analysis_id UUID REFERENCES public.lab_analysis(id),
    production_batch_id UUID REFERENCES public.production_batches(id),
    
    -- Details
    description TEXT NOT NULL,
    value_recorded NUMERIC,
    threshold_value NUMERIC, -- UCL/LCL for violations, Cpk value for thresholds
    cpk_value NUMERIC,
    
    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by UUID REFERENCES public.user_profiles(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.user_profiles(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Auto-NC link
    nonconformity_id UUID REFERENCES public.nonconformities(id),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.spc_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Standard SELECT" ON public.spc_alerts FOR SELECT
    USING (organization_id = public.get_my_org_id() 
    AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL));

CREATE POLICY "Standard INSERT" ON public.spc_alerts FOR INSERT
    WITH CHECK (organization_id = public.get_my_org_id() 
    AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL));

CREATE POLICY "Standard UPDATE" ON public.spc_alerts FOR UPDATE
    USING (organization_id = public.get_my_org_id() 
    AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL))
    WITH CHECK (organization_id = public.get_my_org_id() 
    AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL));

CREATE POLICY "Standard DELETE" ON public.spc_alerts FOR DELETE
    USING (organization_id = public.get_my_org_id() 
    AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL));

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_spc_alerts_status ON public.spc_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_spc_alerts_parameter ON public.spc_alerts(qa_parameter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spc_alerts_batch ON public.spc_alerts(production_batch_id) WHERE production_batch_id IS NOT NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS spc_alerts_audit ON public.spc_alerts;
CREATE TRIGGER spc_alerts_audit
    AFTER INSERT OR UPDATE ON public.spc_alerts
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

COMMENT ON TABLE public.spc_alerts IS 'SPC statistical process control alerts for run rule violations and Cpk threshold breaches.';
