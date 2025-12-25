-- Fix: Add test_category to sample_types and category to product_specifications
-- These columns are required for filtering parameters by sample type

-- 1. Add test_category to sample_types
ALTER TABLE sample_types 
ADD COLUMN IF NOT EXISTS test_category TEXT DEFAULT 'physico_chemical';

ALTER TABLE sample_types DROP CONSTRAINT IF EXISTS sample_types_test_category_check;
ALTER TABLE sample_types 
ADD CONSTRAINT sample_types_test_category_check 
CHECK (test_category IN ('physico_chemical', 'microbiological', 'both'));

-- 2. Add category to product_specifications
ALTER TABLE product_specifications
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'physico_chemical';

ALTER TABLE product_specifications DROP CONSTRAINT IF EXISTS product_specifications_category_check;
ALTER TABLE product_specifications 
ADD CONSTRAINT product_specifications_category_check 
CHECK (category IN ('physico_chemical', 'microbiological', 'sensory', 'other'));

-- 3. Add status column if missing (referenced in code)
ALTER TABLE product_specifications
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. Populate category in product_specifications based on linked qa_parameters.category
UPDATE product_specifications ps
SET category = CASE 
    WHEN qp.category IN ('microbiology', 'microbiological') THEN 'microbiological'
    WHEN qp.category = 'sensory' THEN 'sensory'
    WHEN qp.category = 'other' THEN 'other'
    ELSE 'physico_chemical'
END
FROM qa_parameters qp
WHERE ps.qa_parameter_id = qp.id
AND ps.category IS NULL OR ps.category = 'physico_chemical';

-- 5. Ensure qa_parameters category values are normalized
UPDATE qa_parameters 
SET category = 'physico_chemical' 
WHERE category = 'physico-chemical';

UPDATE qa_parameters 
SET category = 'microbiological' 
WHERE category = 'microbiology';
