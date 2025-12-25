-- 1. Production Lines
CREATE TABLE public.production_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code)
);
ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;

-- 2. Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'obsolete')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, sku)
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Production Batches (The Final Product Run)
CREATE TABLE public.production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    production_line_id UUID NOT NULL REFERENCES public.production_lines(id),
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'blocked')),
    planned_quantity NUMERIC,
    actual_quantity NUMERIC,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code)
);
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- 4. Intermediate Products (Tanks / Mixes)
CREATE TABLE public.intermediate_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    production_batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- Tank Name or Identifier
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_use')),
    volume NUMERIC,
    unit TEXT DEFAULT 'L',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(production_batch_id, code)
);
ALTER TABLE public.intermediate_products ENABLE ROW LEVEL SECURITY;

-- 5. Intermediate Ingredients (Traceability Link)
CREATE TABLE public.intermediate_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    intermediate_product_id UUID NOT NULL REFERENCES public.intermediate_products(id) ON DELETE CASCADE,
    raw_material_lot_code TEXT NOT NULL, -- Linking by code for MVP, or ID if RM module exists
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.intermediate_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Reuse helper)
-- Lines
CREATE POLICY "Users can view lines in their org" ON public.production_lines FOR SELECT USING (organization_id = public.get_my_org_id());
-- Products
CREATE POLICY "Users can view products in their org" ON public.products FOR SELECT USING (organization_id = public.get_my_org_id());
-- Batches
CREATE POLICY "Users can view batches in their org" ON public.production_batches FOR SELECT USING (organization_id = public.get_my_org_id());
-- Intermediates
CREATE POLICY "Users can view intermediate in their org" ON public.intermediate_products FOR SELECT USING (organization_id = public.get_my_org_id());
-- Ingredients
CREATE POLICY "Users can view ingredients in their org" ON public.intermediate_ingredients FOR SELECT USING (organization_id = public.get_my_org_id());
