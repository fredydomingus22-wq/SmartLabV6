-- RPC: Log CIP Step
-- Handles both starting a step (creating the record) and finishing it (updating with metrics).

CREATE OR REPLACE FUNCTION public.log_cip_step(
    p_execution_id UUID,
    p_program_step_id UUID,
    p_status TEXT, -- 'in_progress', 'pass', 'fail'
    p_actual_temp NUMERIC DEFAULT NULL,
    p_actual_conductivity NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_step_id UUID;
    v_start_time TIMESTAMPTZ;
BEGIN
    -- 1. Check if a step record already exists for this execution/step pair
    SELECT id, start_time INTO v_step_id, v_start_time
    FROM public.cip_execution_steps
    WHERE execution_id = p_execution_id AND program_step_id = p_program_step_id
    LIMIT 1;

    -- 2. Logic
    IF v_step_id IS NULL THEN
        -- STARTING A STEP
        INSERT INTO public.cip_execution_steps (
            organization_id,
            execution_id,
            program_step_id,
            status,
            start_time,
            actual_temp_c,
            actual_conductivity
        )
        SELECT 
            organization_id,
            p_execution_id,
            p_program_step_id,
            p_status,
            now(), -- Start time is now
            p_actual_temp,
            p_actual_conductivity
        FROM public.cip_executions
        WHERE id = p_execution_id
        RETURNING id INTO v_step_id;
        
        -- Update execution status to in_progress if not already
        UPDATE public.cip_executions SET status = 'in_progress' WHERE id = p_execution_id AND status = 'pending';

    ELSE
        -- UPDATING / FINISHING A STEP
        UPDATE public.cip_execution_steps
        SET 
            status = p_status,
            actual_temp_c = COALESCE(p_actual_temp, actual_temp_c),
            actual_conductivity = COALESCE(p_actual_conductivity, actual_conductivity),
            end_time = CASE WHEN p_status IN ('pass', 'fail') THEN now() ELSE end_time END,
            actual_duration_sec = CASE 
                WHEN p_status IN ('pass', 'fail') AND v_start_time IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (now() - v_start_time))::INT 
                ELSE actual_duration_sec 
            END
        WHERE id = v_step_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'step_id', v_step_id);
END;
$$;
