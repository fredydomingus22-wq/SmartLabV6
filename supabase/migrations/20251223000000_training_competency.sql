-- Phase 4: Training & Competency Hub Migration

-- 1. Shifts Table
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL, -- Morning, Afternoon, Night, Shift A, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shifts are visible to organization" ON public.shifts
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 2. Teams Table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    description TEXT,
    supervisor_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams are visible to organization" ON public.teams
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 2. Employees Table (Extended Profile/Standalone)
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    employee_id TEXT NOT NULL, -- Internal Company ID
    full_name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    hiring_date DATE,
    status TEXT DEFAULT 'active', -- active, inactive, vacation
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, employee_id)
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees are visible to organization" ON public.employees
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 3. Attendance Logs
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present', -- present, late, absent
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance is visible to organization" ON public.attendance_logs
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 4. Analyst Qualifications (Specific to QA Parameters)
CREATE TABLE public.analyst_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    qa_parameter_id UUID NOT NULL REFERENCES public.qa_parameters(id),
    status TEXT NOT NULL DEFAULT 'trainee', -- trainee, qualified, expert
    qualified_at DATE,
    valid_until DATE,
    certified_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, qa_parameter_id)
);

ALTER TABLE public.analyst_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualifications are visible to organization" ON public.analyst_qualifications
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 5. Training Records (General)
CREATE TABLE public.training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT, -- safety, quality, technical
    completion_date DATE NOT NULL,
    expiry_date DATE,
    score NUMERIC,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training records are visible to organization" ON public.training_records
    FOR SELECT USING (organization_id = public.get_my_org_id());
