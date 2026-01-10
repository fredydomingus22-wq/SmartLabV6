-- 1. Add missing sampling_point_id to specification_history
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.specification_history 
        ADD COLUMN sampling_point_id UUID REFERENCES public.sampling_points(id);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 2. Update the trigger function to match the ACTUAL table schema
-- (Use 'specification_id' instead of 'spec_id', and include 'sampling_point_id')

CREATE OR REPLACE FUNCTION public.handle_spec_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Log history if version increments
    IF NEW.version > OLD.version THEN
        INSERT INTO public.specification_history (
            specification_id, -- Matches existing column name
            product_id,
            qa_parameter_id,
            organization_id,
            min_value,
            max_value,
            target_value,
            text_value_expected,
            is_critical,
            version,
            change_reason,
            changed_by,
            superseded_at,
            sample_type_id,
            sampling_point_id -- Added
        ) VALUES (
            OLD.id,
            OLD.product_id,
            OLD.qa_parameter_id,
            OLD.organization_id,
            OLD.min_value,
            OLD.max_value,
            OLD.target_value,
            OLD.text_value_expected,
            OLD.is_critical,
            OLD.version,
            NEW.change_reason,
            auth.uid(),
            now(),
            OLD.sample_type_id,
            OLD.sampling_point_id -- Capture the old sampling point
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is still bound (it should be, but good to confirm)
DROP TRIGGER IF EXISTS on_spec_update_history ON public.product_specifications;
CREATE TRIGGER on_spec_update_history
    BEFORE UPDATE ON public.product_specifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_spec_history();
