-- Migration: Traceability Engine & Packaging Module
-- Date: 2025-12-23
-- Description: Adds packaging module and traceability chain with auto-population triggers.

-- 1. Packaging Module
CREATE TABLE IF NOT EXISTS public.packaging_materials (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID REFERENCES public.plants(id), -- Nullable for Global Definitions
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    min_stock_level NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packaging_lots (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    packaging_material_id UUID NOT NULL REFERENCES public.packaging_materials(id),
    lot_code TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    remaining_quantity NUMERIC NOT NULL DEFAULT 0,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'quarantine', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.batch_packaging_usage (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    production_batch_id UUID NOT NULL REFERENCES public.production_batches(id),
    packaging_lot_id UUID NOT NULL REFERENCES public.packaging_lots(id),
    quantity_used NUMERIC NOT NULL,
    unit TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id)
);

-- Indexes for Packaging
CREATE INDEX idx_packaging_materials_org ON public.packaging_materials(organization_id);
CREATE INDEX idx_packaging_lots_material ON public.packaging_lots(packaging_material_id);
CREATE INDEX idx_packaging_lots_org_plant ON public.packaging_lots(organization_id, plant_id);
CREATE INDEX idx_batch_pkg_usage_batch ON public.batch_packaging_usage(production_batch_id);

-- RLS for Packaging (Standard)
ALTER TABLE public.packaging_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_packaging_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Packaging Materials
CREATE POLICY "Users can view packaging materials in their org" ON public.packaging_materials
    FOR SELECT USING (organization_id = public.get_my_org_id());

CREATE POLICY "Admins/Plant Admins can manage packaging materials" ON public.packaging_materials
    FOR ALL USING (organization_id = public.get_my_org_id() 
                   AND (plant_id IS NULL OR plant_id = public.get_my_plant_id()));

-- Policies: Packaging Lots
CREATE POLICY "Users can view packaging lots in their plant" ON public.packaging_lots
    FOR SELECT USING (organization_id = public.get_my_org_id() 
                      AND plant_id = public.get_my_plant_id());

CREATE POLICY "Users can manage packaging lots in their plant" ON public.packaging_lots
    FOR ALL USING (organization_id = public.get_my_org_id() 
                   AND plant_id = public.get_my_plant_id());

-- Policies: Batch Packaging Usage
CREATE POLICY "Users can view packaging usage" ON public.batch_packaging_usage
    FOR SELECT USING (organization_id = public.get_my_org_id() 
                      AND plant_id = public.get_my_plant_id());

CREATE POLICY "Users can insert packaging usage" ON public.batch_packaging_usage
    FOR INSERT WITH CHECK (organization_id = public.get_my_org_id() 
                           AND plant_id = public.get_my_plant_id());

-- 2. Traceability Chain Table
CREATE TABLE IF NOT EXISTS public.traceability_chain (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    
    source_type TEXT NOT NULL CHECK (source_type IN ('raw_material', 'packaging_lot', 'intermediate', 'batch')),
    source_id UUID NOT NULL, 
    
    target_type TEXT NOT NULL CHECK (target_type IN ('intermediate', 'batch', 'sample')),
    target_id UUID NOT NULL,
    
    quantity NUMERIC,
    unit TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata constraints
    CONSTRAINT uniq_trace_link UNIQUE (source_type, source_id, target_type, target_id)
);

CREATE INDEX idx_trace_source ON public.traceability_chain(source_id);
CREATE INDEX idx_trace_target ON public.traceability_chain(target_id);
CREATE INDEX idx_trace_org_plant ON public.traceability_chain(organization_id, plant_id);

ALTER TABLE public.traceability_chain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view traceability chain" ON public.traceability_chain
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 3. Triggers for Auto-Population

-- Function: Auto-populate Traceability Chain (Handles INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.fn_update_traceability_chain()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_plant_id UUID;
BEGIN
    -- HANDLE DELETE first (uses OLD)
    IF TG_OP = 'DELETE' THEN
        v_org_id := OLD.organization_id;
        v_plant_id := OLD.plant_id;

        -- 1. Raw Material -> Intermediate
        IF TG_TABLE_NAME = 'intermediate_ingredients' THEN
            DELETE FROM public.traceability_chain 
            WHERE source_type = 'raw_material' 
              AND source_id = OLD.raw_material_lot_id 
              AND target_type = 'intermediate' 
              AND target_id = OLD.intermediate_product_id;

        -- 2. Intermediate -> Batch
        ELSIF TG_TABLE_NAME = 'intermediate_products' THEN
             IF OLD.production_batch_id IS NOT NULL THEN
                DELETE FROM public.traceability_chain 
                WHERE source_type = 'intermediate' 
                  AND source_id = OLD.id 
                  AND target_type = 'batch' 
                  AND target_id = OLD.production_batch_id;
             END IF;

        -- 3. Packaging -> Batch
        ELSIF TG_TABLE_NAME = 'batch_packaging_usage' THEN
            DELETE FROM public.traceability_chain 
            WHERE source_type = 'packaging_lot' 
              AND source_id = OLD.packaging_lot_id 
              AND target_type = 'batch' 
              AND target_id = OLD.production_batch_id;

        -- 4. Batch/Intermediate -> Sample
        ELSIF TG_TABLE_NAME = 'samples' THEN
            IF OLD.intermediate_product_id IS NOT NULL THEN
                DELETE FROM public.traceability_chain 
                WHERE source_type = 'intermediate' 
                  AND source_id = OLD.intermediate_product_id 
                  AND target_type = 'sample' 
                  AND target_id = OLD.id;
            ELSIF OLD.production_batch_id IS NOT NULL THEN
                DELETE FROM public.traceability_chain 
                WHERE source_type = 'batch' 
                  AND source_id = OLD.production_batch_id 
                  AND target_type = 'sample' 
                  AND target_id = OLD.id;
            END IF;
        END IF;
        
        RETURN OLD;
    
    -- HANDLE INSERT / UPDATE (uses NEW)
    ELSE
        v_org_id := NEW.organization_id;
        v_plant_id := NEW.plant_id;

        -- 1. Raw Material -> Intermediate
        IF TG_TABLE_NAME = 'intermediate_ingredients' THEN
            INSERT INTO public.traceability_chain 
            (organization_id, plant_id, source_type, source_id, target_type, target_id, quantity, unit, recorded_at)
            VALUES 
            (v_org_id, v_plant_id, 'raw_material', NEW.raw_material_lot_id, 'intermediate', NEW.intermediate_product_id, NEW.quantity, NEW.unit, NOW())
            ON CONFLICT (source_type, source_id, target_type, target_id) 
            DO UPDATE SET quantity = EXCLUDED.quantity, unit = EXCLUDED.unit, recorded_at = NOW();

        -- 2. Intermediate -> Batch
        ELSIF TG_TABLE_NAME = 'intermediate_products' THEN
            IF NEW.production_batch_id IS NOT NULL THEN
                INSERT INTO public.traceability_chain 
                (organization_id, plant_id, source_type, source_id, target_type, target_id, quantity, unit, recorded_at)
                VALUES 
                (v_org_id, v_plant_id, 'intermediate', NEW.id, 'batch', NEW.production_batch_id, NEW.volume, NEW.unit, NOW())
                ON CONFLICT (source_type, source_id, target_type, target_id) 
                DO UPDATE SET quantity = EXCLUDED.quantity, unit = EXCLUDED.unit, recorded_at = NOW();
            END IF;

        -- 3. Packaging -> Batch
        ELSIF TG_TABLE_NAME = 'batch_packaging_usage' THEN
            INSERT INTO public.traceability_chain 
            (organization_id, plant_id, source_type, source_id, target_type, target_id, quantity, unit, recorded_at)
            VALUES 
            (v_org_id, v_plant_id, 'packaging_lot', NEW.packaging_lot_id, 'batch', NEW.production_batch_id, NEW.quantity_used, NEW.unit, NOW())
            ON CONFLICT (source_type, source_id, target_type, target_id) 
            DO UPDATE SET quantity = EXCLUDED.quantity, unit = EXCLUDED.unit, recorded_at = NOW();

        -- 4. Sample Linkage
        ELSIF TG_TABLE_NAME = 'samples' THEN
            IF NEW.intermediate_product_id IS NOT NULL THEN
                INSERT INTO public.traceability_chain 
                (organization_id, plant_id, source_type, source_id, target_type, target_id, recorded_at)
                VALUES 
                (v_org_id, v_plant_id, 'intermediate', NEW.intermediate_product_id, 'sample', NEW.id, NOW())
                ON CONFLICT (source_type, source_id, target_type, target_id) 
                DO UPDATE SET recorded_at = NOW();
            ELSIF NEW.production_batch_id IS NOT NULL THEN
                INSERT INTO public.traceability_chain 
                (organization_id, plant_id, source_type, source_id, target_type, target_id, recorded_at)
                VALUES 
                (v_org_id, v_plant_id, 'batch', NEW.production_batch_id, 'sample', NEW.id, NOW())
                ON CONFLICT (source_type, source_id, target_type, target_id) 
                DO UPDATE SET recorded_at = NOW();
            END IF;
        END IF;

        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers (INSERT OR UPDATE OR DELETE)
DROP TRIGGER IF EXISTS trg_trace_ingredient ON public.intermediate_ingredients;
CREATE TRIGGER trg_trace_ingredient
    AFTER INSERT OR UPDATE OR DELETE ON public.intermediate_ingredients
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_traceability_chain();

DROP TRIGGER IF EXISTS trg_trace_intermediate_link ON public.intermediate_products;
CREATE TRIGGER trg_trace_intermediate_link
    AFTER INSERT OR UPDATE OR DELETE ON public.intermediate_products
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_traceability_chain();

DROP TRIGGER IF EXISTS trg_trace_packaging ON public.batch_packaging_usage;
CREATE TRIGGER trg_trace_packaging
    AFTER INSERT OR UPDATE OR DELETE ON public.batch_packaging_usage
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_traceability_chain();

DROP TRIGGER IF EXISTS trg_trace_sample ON public.samples;
CREATE TRIGGER trg_trace_sample
    AFTER INSERT OR UPDATE OR DELETE ON public.samples
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_traceability_chain();
