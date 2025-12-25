-- Raw Materials Module
-- Tracks raw material suppliers, lots, and consumption for traceability

-- 1. Suppliers
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code)
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 2. Raw Material Catalog (Types of materials)
CREATE TABLE public.raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    category TEXT, -- ingredient, additive, packaging, etc.
    unit TEXT NOT NULL DEFAULT 'kg', -- base storage unit
    allergens TEXT[], -- array of allergen codes
    storage_conditions TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'obsolete')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, code)
);
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;

-- 3. Raw Material Lots (Received batches from suppliers)
CREATE TABLE public.raw_material_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    lot_code TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_remaining NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    received_date TIMESTAMPTZ DEFAULT now(),
    expiry_date DATE,
    production_date DATE,
    certificate_number TEXT, -- CoA reference
    status TEXT NOT NULL DEFAULT 'quarantine' CHECK (status IN ('quarantine', 'approved', 'rejected', 'exhausted')),
    storage_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, lot_code)
);
ALTER TABLE public.raw_material_lots ENABLE ROW LEVEL SECURITY;

-- 4. Quality Checks on Raw Material Lots (Receipt Inspection)
CREATE TABLE public.raw_material_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    raw_material_lot_id UUID NOT NULL REFERENCES public.raw_material_lots(id) ON DELETE CASCADE,
    qa_parameter_id UUID REFERENCES public.qa_parameters(id),
    check_name TEXT NOT NULL,
    expected_value TEXT,
    actual_value TEXT,
    is_pass BOOLEAN,
    checked_by UUID REFERENCES auth.users(id),
    checked_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);
ALTER TABLE public.raw_material_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view suppliers in their org" ON public.suppliers FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can insert suppliers in their org" ON public.suppliers FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update suppliers in their org" ON public.suppliers FOR UPDATE USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can view raw materials in their org" ON public.raw_materials FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can insert raw materials in their org" ON public.raw_materials FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update raw materials in their org" ON public.raw_materials FOR UPDATE USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can view lots in their org" ON public.raw_material_lots FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can insert lots in their org" ON public.raw_material_lots FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());
CREATE POLICY "Users can update lots in their org" ON public.raw_material_lots FOR UPDATE USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can view checks in their org" ON public.raw_material_checks FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Users can insert checks in their org" ON public.raw_material_checks FOR INSERT WITH CHECK (organization_id = public.get_my_org_id());

-- Index for traceability queries
CREATE INDEX idx_raw_material_lots_code ON public.raw_material_lots(lot_code);
CREATE INDEX idx_raw_material_lots_material ON public.raw_material_lots(raw_material_id);
CREATE INDEX idx_raw_material_lots_supplier ON public.raw_material_lots(supplier_id);
