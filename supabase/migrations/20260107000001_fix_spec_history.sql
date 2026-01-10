-- Ensure specification_history table exists and is structurally correct
CREATE TABLE IF NOT EXISTS public.specification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spec_id UUID NOT NULL REFERENCES public.product_specifications(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    qa_parameter_id UUID NOT NULL REFERENCES public.qa_parameters(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    
    -- Snapshot fields from product_specifications
    min_value NUMERIC,
    max_value NUMERIC,
    target_value NUMERIC,
    text_value_expected TEXT,
    is_critical BOOLEAN,
    
    -- Versioning fields
    version INTEGER NOT NULL,
    change_reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    superseded_at TIMESTAMPTZ DEFAULT now(),
    
    -- Additional contextual fields
    sample_type_id UUID REFERENCES public.sample_types(id)
);

-- Enable RLS
ALTER TABLE public.specification_history ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Users can view spec history in their org" ON public.specification_history;
CREATE POLICY "Users can view spec history in their org" 
ON public.specification_history FOR SELECT 
USING (organization_id = public.get_my_org_id());

-- Add versioning columns to product_specifications if missing
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.product_specifications ADD COLUMN version INTEGER DEFAULT 1;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.product_specifications ADD COLUMN change_reason TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.product_specifications ADD COLUMN changed_by UUID REFERENCES auth.users(id);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Trigger Function
CREATE OR REPLACE FUNCTION public.handle_spec_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Log history if version increments
    IF NEW.version > OLD.version THEN
        INSERT INTO public.specification_history (
            spec_id,
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
            superseded_at
            -- sample_type_id is redundant if tied to spec, but we keep it if it was added
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
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_spec_update_history ON public.product_specifications;
CREATE TRIGGER on_spec_update_history
    BEFORE UPDATE ON public.product_specifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_spec_history();
