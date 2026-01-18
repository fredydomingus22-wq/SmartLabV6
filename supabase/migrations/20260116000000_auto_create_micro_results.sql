-- Migration: Auto-Create Micro Results on Sample Creation
-- Author: Product Dev Specialist & Architect
-- Date: 2026-01-16
-- Description: Automatically generates micro_results rows when a sample is created, based on matching product_specifications.

CREATE OR REPLACE FUNCTION public.fn_auto_create_micro_results()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
    v_spec RECORD;
BEGIN
    -- 1. Determine Product ID (if applicable)
    IF NEW.production_batch_id IS NOT NULL THEN
        SELECT product_id INTO v_product_id
        FROM public.production_batches
        WHERE id = NEW.production_batch_id;
    ELSIF NEW.intermediate_product_id IS NOT NULL THEN
        SELECT pb.product_id INTO v_product_id
        FROM public.intermediate_products ip
        JOIN public.production_batches pb ON ip.batch_id = pb.id
        WHERE ip.id = NEW.intermediate_product_id;
    END IF;

    -- 2. Find and Insert Applicable Tests (Micro_Results)
    -- We use DISTINCT ON (qa_parameter_id) to prioritize specific specs over generic ones
    FOR v_spec IN
        SELECT DISTINCT ON (ps.qa_parameter_id) 
            ps.qa_parameter_id,
            ps.id as spec_id
        FROM public.product_specifications ps
        JOIN public.qa_parameters qp ON ps.qa_parameter_id = qp.id
        WHERE 
            -- Filter to Microbiological Params Only (Crucial!)
            qp.category IN ('microbiological', 'microbiology')
            AND (
                -- Case A: Product-Specific (Matches Product + (Specific SampleType OR Generic))
                (v_product_id IS NOT NULL AND ps.product_id = v_product_id AND (ps.sample_type_id = NEW.sample_type_id OR ps.sample_type_id IS NULL))
                OR
                -- Case B: Environmental Request (Matches Sampling Point)
                (v_product_id IS NULL AND ps.sampling_point_id IS NOT NULL AND ps.sampling_point_id = NEW.sampling_point_id)
                OR
                -- Case C: Global Sample Type Standard (e.g. Water, Air) - Only if no product/point match (Lowest Priority logically, but included in query)
                (v_product_id IS NULL AND ps.sampling_point_id IS NULL AND ps.product_id IS NULL AND ps.sample_type_id = NEW.sample_type_id)
            )
        ORDER BY ps.qa_parameter_id, 
                 -- Priority Sorting:
                 -- 1. Exact Sample Type Match (Specific Phase)
                 (ps.sample_type_id IS NOT NULL) DESC
    LOOP
        -- Insert the result placeholder
        INSERT INTO public.micro_results (
            organization_id,
            plant_id,
            sample_id,
            qa_parameter_id,
            status,
            created_at
        ) VALUES (
            NEW.organization_id,
            NEW.plant_id,
            NEW.id,
            v_spec.qa_parameter_id,
            'pending', -- Initial status awaiting incubator assignment
            now()
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists to allow idempotent re-run
DROP TRIGGER IF EXISTS tr_auto_create_micro_results ON public.samples;

-- Create Trigger
CREATE TRIGGER tr_auto_create_micro_results
AFTER INSERT ON public.samples
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_create_micro_results();

-- Add 'pending' to micro_results status check constraints if not exists
-- Only strictly necessary if the original migration had a strict check.
-- We alter the constraint to be safe.
DO $$
BEGIN
    ALTER TABLE public.micro_results DROP CONSTRAINT IF EXISTS micro_results_status_check;
    ALTER TABLE public.micro_results ADD CONSTRAINT micro_results_status_check 
        CHECK (status IN ('pending', 'incubating', 'reading_pending', 'completed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Constraint update skipped or failed';
END $$;
