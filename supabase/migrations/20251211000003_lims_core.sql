-- 1. QA Parameters
CREATE TABLE public.qa_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    unit TEXT,
    category TEXT CHECK (category IN ('physico-chemical', 'microbiology', 'sensory')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'obsolete')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code)
);
ALTER TABLE public.qa_parameters ENABLE ROW LEVEL SECURITY;

-- 2. Sample Types
CREATE TABLE public.sample_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL, -- 'Tank', 'Finished Product', 'Water'
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code)
);
ALTER TABLE public.sample_types ENABLE ROW LEVEL SECURITY;

-- 3. Samples
CREATE TABLE public.samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    production_batch_id UUID REFERENCES public.production_batches(id), -- Nullable for Water/Env samples
    intermediate_product_id UUID REFERENCES public.intermediate_products(id),
    sample_type_id UUID NOT NULL REFERENCES public.sample_types(id),
    code TEXT NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT now(),
    collected_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_analysis', 'reviewed', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code) -- Or just ID
);
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;

-- 4. Lab Analysis (Results)
CREATE TABLE public.lab_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
    qa_parameter_id UUID NOT NULL REFERENCES public.qa_parameters(id),
    value_numeric NUMERIC,
    value_text TEXT,
    is_conforming BOOLEAN,
    analyzed_by UUID REFERENCES auth.users(id),
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    signed_transaction_hash TEXT, -- 21 CFR Part 11
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lab_analysis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view params in their org" ON public.qa_parameters FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can view sample types in their org" ON public.sample_types FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can view samples in their org" ON public.samples FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can view analysis in their org" ON public.lab_analysis FOR SELECT USING (organization_id = public.get_my_org_id());
