-- 1. Hazard Analysis Headers
CREATE TABLE public.haccp_hazards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    process_step TEXT NOT NULL,
    hazard_description TEXT NOT NULL,
    hazard_category TEXT CHECK (hazard_category IN ('biological', 'chemical', 'physical', 'allergen', 'radiological')),
    risk_probability INT, -- 1-5
    risk_severity INT, -- 1-5
    is_significant BOOLEAN DEFAULT FALSE,
    control_measure TEXT,
    is_pcc BOOLEAN DEFAULT FALSE, -- Critical Control Point
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.haccp_hazards ENABLE ROW LEVEL SECURITY;

-- 2. PCC Monitoring Logs (Critical Control Points)
CREATE TABLE public.pcc_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    hazard_id UUID NOT NULL REFERENCES public.haccp_hazards(id),
    
    checked_at TIMESTAMPTZ DEFAULT now(),
    checked_by UUID REFERENCES auth.users(id),
    equipment_id TEXT, -- e.g. Pasteurizer ID
    
    critical_limit_min NUMERIC,
    critical_limit_max NUMERIC,
    actual_value NUMERIC,
    
    is_compliant BOOLEAN,
    action_taken TEXT, -- If non-compliant
    
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pcc_logs ENABLE ROW LEVEL SECURITY;

-- 3. PRP Executions (Pre-Requisite Programs / Checklists)
-- Simplified structure for digital checklists
CREATE TABLE public.prp_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL, -- "Daily Hygiene Check - Line 1"
    program_type TEXT, -- "Hygiene", "Pest Control", "Glass", "Maintenance"
    
    performed_at TIMESTAMPTZ DEFAULT now(),
    performed_by UUID REFERENCES auth.users(id),
    
    checklist_data JSONB, -- { "floor_clean": true, "drains_clear": false }
    
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.prp_executions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View Hazards" ON public.haccp_hazards FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View PCC Logs" ON public.pcc_logs FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View PRP Logs" ON public.prp_executions FOR SELECT USING (organization_id = public.get_my_org_id());

-- Audit Triggers
CREATE TRIGGER audit_hazards AFTER INSERT OR UPDATE OR DELETE ON public.haccp_hazards FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_pcc AFTER INSERT OR UPDATE OR DELETE ON public.pcc_logs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
