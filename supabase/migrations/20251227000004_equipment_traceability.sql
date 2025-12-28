-- 20251227000004_equipment_traceability.sql
-- Extend traceability engine to CIP and Lab Equipment usage

-- 1. Update source_type constraint for traceability_chain
ALTER TABLE public.traceability_chain 
DROP CONSTRAINT IF EXISTS traceability_chain_source_type_check;

ALTER TABLE public.traceability_chain 
ADD CONSTRAINT traceability_chain_source_type_check 
CHECK (source_type IN ('raw_material', 'packaging_lot', 'intermediate', 'batch', 'equipment', 'cip_execution', 'raw_material_lot'));

-- 2. Update the function to handle lab_analysis and cip_executions
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
            WHERE source_type IN ('raw_material', 'raw_material_lot')
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

        -- 5. Equipment -> Sample (Lab Analysis)
        ELSIF TG_TABLE_NAME = 'lab_analysis' THEN
            IF OLD.equipment_id IS NOT NULL THEN
                DELETE FROM public.traceability_chain 
                WHERE source_type = 'equipment' 
                  AND source_id = OLD.equipment_id 
                  AND target_type = 'sample' 
                  AND target_id = OLD.sample_id;
            END IF;

        -- 6. CIP -> Asset (Optional: directly to tank/line)
        ELSIF TG_TABLE_NAME = 'cip_executions' THEN
             DELETE FROM public.traceability_chain 
             WHERE source_type = 'cip_execution' 
               AND source_id = OLD.id;
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
            (v_org_id, v_plant_id, 'raw_material_lot', NEW.raw_material_lot_id, 'intermediate', NEW.intermediate_product_id, NEW.quantity, NEW.unit, NOW())
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

        -- 5. Equipment -> Sample (Lab Analysis)
        ELSIF TG_TABLE_NAME = 'lab_analysis' THEN
            IF NEW.equipment_id IS NOT NULL THEN
                INSERT INTO public.traceability_chain 
                (organization_id, plant_id, source_type, source_id, target_type, target_id, recorded_at)
                VALUES 
                (v_org_id, v_plant_id, 'equipment', NEW.equipment_id, 'sample', NEW.sample_id, NOW())
                ON CONFLICT (source_type, source_id, target_type, target_id) 
                DO UPDATE SET recorded_at = NOW();
            END IF;

        -- 6. CIP -> Asset (Tanque/Linha)
        ELSIF TG_TABLE_NAME = 'cip_executions' THEN
            IF NEW.validation_status = 'valid' AND NEW.equipment_uid IS NOT NULL THEN
                 INSERT INTO public.traceability_chain 
                 (organization_id, plant_id, source_type, source_id, target_type, target_id, recorded_at)
                 VALUES 
                 (v_org_id, v_plant_id, 'cip_execution', NEW.id, 'intermediate', NEW.equipment_uid, NOW())
                 ON CONFLICT (source_type, source_id, target_type, target_id) 
                 DO UPDATE SET recorded_at = NOW();
            END IF;
        END IF;

        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure Triggers are attached
DROP TRIGGER IF EXISTS trg_trace_lab_analysis ON public.lab_analysis;
CREATE TRIGGER trg_trace_lab_analysis
    AFTER INSERT OR UPDATE OR DELETE ON public.lab_analysis
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_traceability_chain();

DROP TRIGGER IF EXISTS trg_trace_cip ON public.cip_executions;
CREATE TRIGGER trg_trace_cip
    AFTER INSERT OR UPDATE OR DELETE ON public.cip_executions
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_traceability_chain();
