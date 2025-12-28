-- Link Specifications to HACCP Hazards
ALTER TABLE public.product_specifications 
ADD COLUMN haccp_hazard_id UUID REFERENCES public.haccp_hazards(id);

-- Support text values in PCC Logs (for qualitative OPRPs)
ALTER TABLE public.pcc_logs 
ADD COLUMN actual_value_text TEXT;

-- Function to Automate PCC/OPRP Logging
CREATE OR REPLACE FUNCTION public.auto_log_pcc_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_spec_id UUID;
  v_hazard_id UUID;
BEGIN
  -- Only run if status changed to approved/validated
  IF NEW.status IN ('approved', 'validated') AND (OLD.status IS NULL OR OLD.status NOT IN ('approved', 'validated')) THEN
    
    -- 1. Identify Product via Sample -> Batch
    SELECT pb.product_id INTO v_product_id
    FROM public.samples s
    JOIN public.production_batches pb ON s.production_batch_id = pb.id
    WHERE s.id = NEW.sample_id;

    -- If no product linked (e.g. water sample), skip
    IF v_product_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- 2. Find matching Specification linked to a Hazard
    -- We assume 1:1 Parameter per Product, or take the most relevant one
    SELECT haccp_hazard_id INTO v_hazard_id
    FROM public.product_specifications
    WHERE product_id = v_product_id
      AND qa_parameter_id = NEW.qa_parameter_id
      AND haccp_hazard_id IS NOT NULL
    LIMIT 1;

    -- 3. If Hazard found, Insert Log
    IF v_hazard_id IS NOT NULL THEN
      INSERT INTO public.pcc_logs (
          organization_id,
          plant_id,
          hazard_id,
          checked_at,
          checked_by,
          actual_value,
          actual_value_text,
          is_compliant,
          equipment_id, -- Can we infer equipment? Maybe from sample -> batch -> line? Leaving null for now.
          action_taken
      ) VALUES (
          NEW.organization_id,
          NEW.plant_id,
          v_hazard_id,
          NEW.analyzed_at,
          NEW.analyzed_by,
          NEW.value_numeric,
          NEW.value_text,
          NEW.is_conforming,
          NULL,
          CASE WHEN NEW.is_conforming = FALSE THEN 'Flagged via LIMS Analysis' ELSE NULL END
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trigger_auto_log_pcc ON public.lab_analysis;
CREATE TRIGGER trigger_auto_log_pcc
AFTER UPDATE ON public.lab_analysis
FOR EACH ROW
EXECUTE FUNCTION public.auto_log_pcc_entry();
