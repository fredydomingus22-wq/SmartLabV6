-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
CREATE TYPE public.user_role AS ENUM ('admin', 'qa_manager', 'lab_tech', 'operator', 'auditor');

-- 3. Create Organizations (Tenant Root)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'trial',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 4. Create Plants (Factory)
CREATE TABLE public.plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address JSONB,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, code)
);
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- 5. Create User Profiles (Extending auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID REFERENCES public.plants(id),
    role public.user_role NOT NULL DEFAULT 'lab_tech',
    full_name TEXT,
    employee_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Helper Function for RLS (Temporary until Custom Claims)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 7. RLS Policies

-- Organization: Read Only (Own)
CREATE POLICY "Users can view their own organization"
    ON public.organizations FOR SELECT
    USING (id = public.get_my_org_id());

-- Plants: Read Only (Own Org)
CREATE POLICY "Users can view plants in their organization"
    ON public.plants FOR SELECT
    USING (organization_id = public.get_my_org_id());

-- Profiles: Read All (Own Org), Update (Self)
CREATE POLICY "Users can view profiles in their organization"
    ON public.user_profiles FOR SELECT
    USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (id = auth.uid());
