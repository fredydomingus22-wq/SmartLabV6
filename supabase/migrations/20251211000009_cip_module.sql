-- 1. CIP Programs
CREATE TABLE public.cip_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL, -- e.g. "Alklaline Wash - Tanks"
    target_equipment_type TEXT, -- e.g. "tank", "line"
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, name)
);
ALTER TABLE public.cip_programs ENABLE ROW LEVEL SECURITY;

-- 2. CIP Program Steps (Definitions)
CREATE TABLE public.cip_program_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    program_id UUID NOT NULL REFERENCES public.cip_programs(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    name TEXT NOT NULL, -- "Pre-rinse", "Caustic", "Final Rinse"
    target_temp_c NUMERIC,
    target_duration_sec INT,
    target_conductivity NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(program_id, step_order)
);
ALTER TABLE public.cip_program_steps ENABLE ROW LEVEL SECURITY;

-- 3. CIP Executions (Run Log)
CREATE TABLE public.cip_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    program_id UUID NOT NULL REFERENCES public.cip_programs(id),
    equipment_type TEXT NOT NULL, -- "tank", "line"
    equipment_id TEXT NOT NULL, -- Could be Linked to intermediate_products(code) or production_lines(code)
    
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    performed_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'aborted')),
    
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
    
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cip_executions ENABLE ROW LEVEL SECURITY;

-- 4. CIP Execution Steps (Actual Data)
CREATE TABLE public.cip_execution_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    execution_id UUID NOT NULL REFERENCES public.cip_executions(id) ON DELETE CASCADE,
    program_step_id UUID REFERENCES public.cip_program_steps(id),
    
    actual_temp_c NUMERIC,
    actual_duration_sec INT,
    actual_conductivity NUMERIC,
    
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cip_execution_steps ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View CIP Programs" ON public.cip_programs FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View CIP Executions" ON public.cip_executions FOR SELECT USING (organization_id = public.get_my_org_id());

-- Audit Triggers
CREATE TRIGGER audit_cip_progs AFTER INSERT OR UPDATE OR DELETE ON public.cip_programs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_cip_execs AFTER INSERT OR UPDATE OR DELETE ON public.cip_executions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
