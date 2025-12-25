-- Add spec_type column to product_specifications for direct filtering
ALTER TABLE product_specifications 
ADD COLUMN IF NOT EXISTS spec_type TEXT DEFAULT 'physico_chemical';

-- Add constraint for valid values
ALTER TABLE product_specifications DROP CONSTRAINT IF EXISTS product_specifications_spec_type_check;
ALTER TABLE product_specifications 
ADD CONSTRAINT product_specifications_spec_type_check 
CHECK (spec_type IN ('physico_chemical', 'microbiological', 'sensory', 'other'));

-- Update existing specs based on their qa_parameter category
UPDATE product_specifications ps
SET spec_type = CASE 
    WHEN qp.category IN ('microbiological', 'microbiology') THEN 'microbiological'
    WHEN qp.category IN ('sensory') THEN 'sensory'
    WHEN qp.category IN ('other') THEN 'other'
    ELSE 'physico_chemical'
END
FROM qa_parameters qp
WHERE ps.qa_parameter_id = qp.id;
