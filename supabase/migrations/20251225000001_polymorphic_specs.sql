-- Refined migration for polymorphic specs (v5 with history reassignment)

DO $$
DECLARE
    r RECORD;
    winner_id UUID;
BEGIN
    -- 0a. Data Cleaning: Handle Duplicates
    -- Loop through sets of duplicates
    FOR r IN 
        SELECT product_id, qa_parameter_id
        FROM public.product_specifications
        WHERE product_id IS NOT NULL
        GROUP BY product_id, qa_parameter_id
        HAVING count(id) > 1
    LOOP
        -- Pick winner (latest created or updated)
        SELECT id INTO winner_id 
        FROM public.product_specifications 
        WHERE product_id = r.product_id AND qa_parameter_id = r.qa_parameter_id 
        ORDER BY created_at DESC LIMIT 1;
        
        -- Reassign history from losers to winner
        UPDATE public.specification_history
        SET specification_id = winner_id
        WHERE specification_id IN (
            SELECT id FROM public.product_specifications 
            WHERE product_id = r.product_id AND qa_parameter_id = r.qa_parameter_id AND id != winner_id
        );
        
        -- Delete losers
        DELETE FROM public.product_specifications 
        WHERE product_id = r.product_id AND qa_parameter_id = r.qa_parameter_id AND id != winner_id;
    END LOOP;

    -- 0b. Data Cleaning: Ensure no rows violate the future constraint
    -- If product_id is set, it's a Product Spec. Clear sample_type_id.
    UPDATE public.product_specifications 
    SET sample_type_id = NULL 
    WHERE product_id IS NOT NULL AND sample_type_id IS NOT NULL;

    -- 1. Add sampling_point_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_specifications' AND column_name = 'sampling_point_id') THEN
        ALTER TABLE public.product_specifications ADD COLUMN sampling_point_id UUID REFERENCES public.sampling_points(id);
    END IF;

    -- 2. Make product_id nullable
    ALTER TABLE public.product_specifications ALTER COLUMN product_id DROP NOT NULL;
    
    -- 3. Drop old constraint if exists
    ALTER TABLE public.product_specifications DROP CONSTRAINT IF EXISTS product_specifications_unique_spec;
    ALTER TABLE public.product_specifications DROP CONSTRAINT IF EXISTS product_specifications_product_id_qa_parameter_id_key;

    -- 4. Check constraint
    ALTER TABLE public.product_specifications DROP CONSTRAINT IF EXISTS chk_spec_target_defined;
    ALTER TABLE public.product_specifications
    ADD CONSTRAINT chk_spec_target_defined CHECK (
        (product_id IS NOT NULL AND sample_type_id IS NULL AND sampling_point_id IS NULL) OR
        (product_id IS NULL AND sample_type_id IS NOT NULL AND sampling_point_id IS NULL) OR
        (product_id IS NULL AND sample_type_id IS NULL AND sampling_point_id IS NOT NULL)
    );

END $$;

DROP INDEX IF EXISTS idx_specs_product;
DROP INDEX IF EXISTS idx_specs_sample_type;
DROP INDEX IF EXISTS idx_specs_sampling_point;

CREATE UNIQUE INDEX idx_specs_product ON public.product_specifications (product_id, qa_parameter_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX idx_specs_sample_type ON public.product_specifications (sample_type_id, qa_parameter_id) WHERE sample_type_id IS NOT NULL;
CREATE UNIQUE INDEX idx_specs_sampling_point ON public.product_specifications (sampling_point_id, qa_parameter_id) WHERE sampling_point_id IS NOT NULL;
