-- RPC Functions for Atomic Operations

-- 1. create_golden_batch
-- Consolidates Batch creation, Tank mapping, and initial Sampling Plan
CREATE OR REPLACE FUNCTION public.create_golden_batch(
    p_plant_id UUID,
    p_product_id UUID,
    p_line_id UUID,
    p_batch_code TEXT,
    p_quantity NUMERIC,
    p_start_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
    v_batch_id UUID;
    v_tank_id UUID;
BEGIN
    -- Get Context
    v_org_id := public.get_my_org_id();
    
    -- 1. Create Batch
    INSERT INTO public.production_batches (
        organization_id, plant_id, product_id, production_line_id, 
        code, planned_quantity, start_date, status
    )
    VALUES (
        v_org_id, p_plant_id, p_product_id, p_line_id,
        p_batch_code, p_quantity, p_start_date, 'open'
    )
    RETURNING id INTO v_batch_id;
    
    -- 2. Create Intermediate Product (Tank) linkage
    -- Assumes 1 Tank per Batch for simplicity in Golden Batch scenario
    INSERT INTO public.intermediate_products (
        organization_id, plant_id, production_batch_id, 
        code, status, volume
    )
    VALUES (
        v_org_id, p_plant_id, v_batch_id,
        'TANK-' || p_batch_code, 'pending', p_quantity
    )
    RETURNING id INTO v_tank_id;
    
    -- 3. Auto-Create 3 Samples (Start, Middle, End) based on logic
    -- Sample 1: Start
    INSERT INTO public.samples (organization_id, plant_id, production_batch_id, intermediate_product_id, sample_type_id, code, status)
    SELECT v_org_id, p_plant_id, v_batch_id, v_tank_id, id, p_batch_code || '-S01', 'collected'
    FROM public.sample_types WHERE name = 'Finished Product' LIMIT 1;

    -- Return JSON with IDs
    RETURN jsonb_build_object(
        'batch_id', v_batch_id,
        'tank_id', v_tank_id
    );
END;
$$;


-- 2. register_sample_result
-- Registers a lab result and checks against product specs
CREATE OR REPLACE FUNCTION public.register_sample_result(
    p_sample_id UUID,
    p_qa_parameter_id UUID,
    p_value_numeric NUMERIC DEFAULT NULL,
    p_value_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
    v_plant_id UUID;
    v_product_id UUID;
    v_spec RECORD;
    v_is_conforming BOOLEAN := TRUE;
    v_analysis_id UUID;
BEGIN
    -- Get Context & Sample Metadata
    v_org_id := public.get_my_org_id();
    
    SELECT s.plant_id, b.product_id 
    INTO v_plant_id, v_product_id
    FROM public.samples s
    JOIN public.production_batches b ON s.production_batch_id = b.id
    WHERE s.id = p_sample_id;
    
    -- 1. Check Specification
    SELECT * INTO v_spec
    FROM public.product_specifications
    WHERE product_id = v_product_id AND qa_parameter_id = p_qa_parameter_id;
    
    IF FOUND THEN
        IF p_value_numeric IS NOT NULL THEN
            IF (v_spec.min_value IS NOT NULL AND p_value_numeric < v_spec.min_value) OR
               (v_spec.max_value IS NOT NULL AND p_value_numeric > v_spec.max_value) THEN
                v_is_conforming := FALSE;
            END IF;
        END IF;
        
        -- Text check could be added here
        IF p_value_text IS NOT NULL AND v_spec.text_value_expected IS NOT NULL THEN
             IF p_value_text != v_spec.text_value_expected THEN
                 v_is_conforming := FALSE;
             END IF;
        END IF;
    END IF;
    
    -- 2. Insert Result
    INSERT INTO public.lab_analysis (
        organization_id, plant_id, sample_id, qa_parameter_id,
        value_numeric, value_text, is_conforming, analyzed_by, analyzed_at
    )
    VALUES (
        v_org_id, v_plant_id, p_sample_id, p_qa_parameter_id,
        p_value_numeric, p_value_text, v_is_conforming, auth.uid(), now()
    )
    RETURNING id INTO v_analysis_id;
    
    RETURN jsonb_build_object(
        'analysis_id', v_analysis_id,
        'is_conforming', v_is_conforming
    );
END;
$$;
