-- ============================================
-- COMPLETE FIX: Sample Type Filtering System
-- Execute this entire script in Supabase SQL Editor
-- ============================================

-- 1. Fix qa_parameters category constraint
ALTER TABLE qa_parameters DROP CONSTRAINT IF EXISTS qa_parameters_category_check;
ALTER TABLE qa_parameters 
ADD CONSTRAINT qa_parameters_category_check 
CHECK (category IN ('physico_chemical', 'microbiological', 'sensory', 'other'));

-- 2. Normalize existing qa_parameters category values
UPDATE qa_parameters SET category = 'physico_chemical' WHERE category = 'physico-chemical';
UPDATE qa_parameters SET category = 'microbiological' WHERE category = 'microbiology';
UPDATE qa_parameters SET category = 'physico_chemical' WHERE category IS NULL;

-- 3. Add test_category to sample_types if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sample_types' AND column_name = 'test_category') THEN
        ALTER TABLE sample_types ADD COLUMN test_category TEXT DEFAULT 'physico_chemical';
    END IF;
END $$;

-- 4. Add category to product_specifications if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_specifications' AND column_name = 'category') THEN
        ALTER TABLE product_specifications ADD COLUMN category TEXT DEFAULT 'physico_chemical';
    END IF;
END $$;

-- 5. Add status to product_specifications if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_specifications' AND column_name = 'status') THEN
        ALTER TABLE product_specifications ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 6. Update product_specifications.category from qa_parameters.category
UPDATE product_specifications ps
SET category = qp.category
FROM qa_parameters qp
WHERE ps.qa_parameter_id = qp.id
AND qp.category IS NOT NULL;

-- 7. Verification queries
SELECT 'qa_parameters categories:' as info;
SELECT category, COUNT(*) FROM qa_parameters GROUP BY category;

SELECT 'product_specifications categories:' as info;
SELECT category, COUNT(*) FROM product_specifications GROUP BY category;

SELECT 'sample_types test_category:' as info;
SELECT name, test_category FROM sample_types LIMIT 10;
