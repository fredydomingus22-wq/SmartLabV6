-- Update the trigger function to include plant_id
CREATE OR REPLACE FUNCTION public.handle_spec_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Log history if version increments
    IF NEW.version > OLD.version THEN
        INSERT INTO public.specification_history (
            specification_id,
            product_id,
            qa_parameter_id,
            organization_id,
            plant_id, -- Added this
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
            sampling_point_id
        ) VALUES (
            OLD.id,
            OLD.product_id,
            OLD.qa_parameter_id,
            OLD.organization_id,
            OLD.plant_id, -- Added this
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
            OLD.sampling_point_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
