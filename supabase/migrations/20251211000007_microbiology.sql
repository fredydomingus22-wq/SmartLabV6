-- 1. Micro Media Types
CREATE TABLE public.micro_media_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL, -- e.g., 'PCA', 'VRB'
    description TEXT,
    incubation_hours_min INT,
    incubation_hours_max INT,
    incubation_temp_c NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, name)
);
ALTER TABLE public.micro_media_types ENABLE ROW LEVEL SECURITY;

-- 2. Micro Media Lots (Inventory)
CREATE TABLE public.micro_media_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    media_type_id UUID NOT NULL REFERENCES public.micro_media_types(id),
    lot_code TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_initial INT,
    quantity_current INT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, lot_code)
);
ALTER TABLE public.micro_media_lots ENABLE ROW LEVEL SECURITY;

-- 3. Incubators
CREATE TABLE public.micro_incubators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL, -- e.g., 'Incubator 01'
    setpoint_temp_c NUMERIC NOT NULL,
    capacity_plates INT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.micro_incubators ENABLE ROW LEVEL SECURITY;

-- 4. Micro Test Sessions (Grouping)
CREATE TABLE public.micro_test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    incubator_id UUID NOT NULL REFERENCES public.micro_incubators(id),
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    started_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'incubating' CHECK (status IN ('incubating', 'reading_pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.micro_test_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Micro Results (Linked to Sample)
CREATE TABLE public.micro_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
    qa_parameter_id UUID NOT NULL REFERENCES public.qa_parameters(id),
    media_lot_id UUID REFERENCES public.micro_media_lots(id),
    test_session_id UUID REFERENCES public.micro_test_sessions(id),
    
    colony_count INT,
    is_tntc BOOLEAN DEFAULT FALSE, -- Too Numerous To Count
    is_presence_absence BOOLEAN DEFAULT FALSE,
    result_text TEXT, -- 'Detected', 'Not Detected'
    
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES auth.users(id),
    
    status TEXT DEFAULT 'incubating' CHECK (status IN ('incubating', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.micro_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View Media Types" ON public.micro_media_types FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View Media Lots" ON public.micro_media_lots FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View Incubators" ON public.micro_incubators FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View Test Sessions" ON public.micro_test_sessions FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View Micro Results" ON public.micro_results FOR SELECT USING (organization_id = public.get_my_org_id());

-- Audit Triggers
CREATE TRIGGER audit_media_types AFTER INSERT OR UPDATE OR DELETE ON public.micro_media_types FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_media_lots AFTER INSERT OR UPDATE OR DELETE ON public.micro_media_lots FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_incubators AFTER INSERT OR UPDATE OR DELETE ON public.micro_incubators FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON public.micro_test_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_micro_res AFTER INSERT OR UPDATE OR DELETE ON public.micro_results FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
