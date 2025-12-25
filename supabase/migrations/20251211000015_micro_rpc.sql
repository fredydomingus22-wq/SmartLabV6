-- RPC: Register Microbiology Result
-- Handles updating the result, setting status to completed, and optionally checking against limits (though limits might be in specialized specs)

CREATE OR REPLACE FUNCTION public.register_micro_result(
    p_result_id UUID,
    p_colony_count INT DEFAULT NULL,
    p_is_tntc BOOLEAN DEFAULT FALSE,
    p_is_presence_absence BOOLEAN DEFAULT FALSE,
    p_result_text TEXT DEFAULT NULL,
    p_read_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_result_record public.micro_results%ROWTYPE;
    v_updated_result public.micro_results%ROWTYPE;
BEGIN
    -- 1. Verify existence and ownership
    SELECT * INTO v_result_record
    FROM public.micro_results
    WHERE id = p_result_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Micro result record not found.';
    END IF;

    -- 2. Update the record
    UPDATE public.micro_results
    SET 
        colony_count = p_colony_count,
        is_tntc = p_is_tntc,
        is_presence_absence = p_is_presence_absence,
        result_text = p_result_text,
        read_at = now(),
        read_by = p_read_by,
        status = 'completed'
    WHERE id = p_result_id
    RETURNING * INTO v_updated_result;

    -- 3. Return success
    RETURN jsonb_build_object(
        'success', true,
        'result_id', v_updated_result.id,
        'status', v_updated_result.status
    );
END;
$$;
