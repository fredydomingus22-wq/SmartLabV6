-- 1. Reagents Master
CREATE TABLE IF NOT EXISTS public.reagents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    name TEXT NOT NULL,
    cas_number TEXT,
    supplier TEXT,
    storage_location TEXT,
    min_stock_level INT DEFAULT 0,
    unit TEXT DEFAULT 'units',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'obsolete')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plant_id, name)
);
ALTER TABLE public.reagents ENABLE ROW LEVEL SECURITY;

-- 2. Reagent Movements (Stock Ledger)
CREATE TABLE IF NOT EXISTS public.reagent_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    reagent_id UUID NOT NULL REFERENCES public.reagents(id) ON DELETE CASCADE,
    
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity NUMERIC NOT NULL, -- Positive for 'in', Negative for 'out' basically, but we store absolute and use type to sign
    
    batch_number TEXT, -- For 'in' movements
    expiry_date DATE,  -- For 'in' movements
    
    user_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reagent_movements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View Reagents" ON public.reagents FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Manage Reagents" ON public.reagents FOR ALL USING (organization_id = public.get_my_org_id());

CREATE POLICY "View Reagent Movements" ON public.reagent_movements FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "Manage Reagent Movements" ON public.reagent_movements FOR ALL USING (organization_id = public.get_my_org_id());

-- Audit Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_reagents') THEN
        CREATE TRIGGER audit_reagents AFTER INSERT OR UPDATE OR DELETE ON public.reagents FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_reagent_movs') THEN
        CREATE TRIGGER audit_reagent_movs AFTER INSERT OR UPDATE OR DELETE ON public.reagent_movements FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
END $$;
