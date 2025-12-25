-- Relax chk_spec_target_defined to allow Product + Phase (sample_type_id)
-- This enables defining specifications for specific intermediate stages of a product.

DO $$
BEGIN
    -- 1. Drop existing restricted constraint
    ALTER TABLE public.product_specifications DROP CONSTRAINT IF EXISTS chk_spec_target_defined;

    -- 2. Add relaxed constraint
    -- Logic: 
    -- - Must have at least one of (product_id, sample_type_id, sampling_point_id)
    -- - If sampling_point_id is set, others must be null (standalone monitoring point)
    -- - If product_id is set, sampling_point_id must be null (but sample_type_id is allowed for phases)
    -- - If only sample_type_id is set, others must be null (global phase standards)
    ALTER TABLE public.product_specifications
    ADD CONSTRAINT chk_spec_target_defined CHECK (
        (product_id IS NOT NULL OR sample_type_id IS NOT NULL OR sampling_point_id IS NOT NULL) AND
        (
            (sampling_point_id IS NOT NULL AND product_id IS NULL AND sample_type_id IS NULL) OR
            (sampling_point_id IS NULL) -- product_id and sample_type_id can coexist
        )
    );
END $$;
