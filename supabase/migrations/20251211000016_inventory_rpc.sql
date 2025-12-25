-- RPC: Consume Reagent Stock
-- Decrements stock by creating an OUT movement.
-- For MVP, this serves as a simple logger. In complex scenarios, it would match FIFO batches.

CREATE OR REPLACE FUNCTION public.consume_reagent_stock(
    p_reagent_id UUID,
    p_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reagent public.reagents%ROWTYPE;
BEGIN
    -- 1. Check Reagent
    SELECT * INTO v_reagent FROM public.reagents WHERE id = p_reagent_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reagent not found';
    END IF;

    -- 2. Insert Movement (OUT)
    INSERT INTO public.reagent_movements (
        organization_id,
        plant_id,
        reagent_id,
        movement_type,
        quantity,
        user_id,
        notes
    ) VALUES (
        v_reagent.organization_id,
        v_reagent.plant_id,
        p_reagent_id,
        'out',
        p_quantity,
        v_user_id,
        p_notes
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
