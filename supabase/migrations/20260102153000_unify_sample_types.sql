-- Migration: Unify Sample Types to Global Scope (Corrected V4)

DO $$
DECLARE
    fallback_fq_id uuid;
    fallback_micro_id uuid;
BEGIN

-- 0. Drop NOT NULL constraints on sample_types AND audit_logs
ALTER TABLE sample_types ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE sample_types ALTER COLUMN plant_id DROP NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN organization_id DROP NOT NULL;

-- 1. Insert Master Types with NULL organization_id (Global)
INSERT INTO sample_types (organization_id, plant_id, code, name, test_category, retention_time_days, default_sla_minutes)
SELECT 
    NULL, NULL, code, name, test_category, retention_time_days, default_sla_minutes
FROM (VALUES
    ('FP-FQ', 'Finished Product (FQ)', 'physico_chemical', 30, 2880),
    ('FP-MICRO', 'Finished Product (Micro)', 'microbiological', 30, 2880),
    ('RAW-FQ', 'Raw Material (FQ)', 'physico_chemical', 30, 2880),
    ('RAW-MICRO', 'Raw Material (Micro)', 'microbiological', 30, 2880),
    ('IP-FQ', 'Intermediate Product (FQ)', 'physico_chemical', 30, 2880),
    ('IP-MICRO', 'Intermediate Product (Micro)', 'microbiological', 30, 2880),
    ('ENV-MICRO', 'Environmental (Micro)', 'microbiological', 30, 2880),
    ('WATER-FQ', 'Water (FQ)', 'physico_chemical', 30, 2880),
    ('WATER-MICRO', 'Water (Micro)', 'microbiological', 30, 2880),
    ('UT-FQ', 'Utilities (FQ)', 'physico_chemical', 30, 2880),
    ('UT-MICRO', 'Utilities (Micro)', 'microbiological', 30, 2880),
    ('SB-MICRO', 'Sanitation (Swabs)', 'microbiological', 30, 2880)
) AS t(code, name, test_category, retention_time_days, default_sla_minutes)
WHERE NOT EXISTS (
    SELECT 1 FROM sample_types st WHERE st.code = t.code AND st.organization_id IS NULL
);

-- Retrieve IDs for fallbacks to ensure NOT NULL compliance
SELECT id INTO fallback_fq_id FROM sample_types WHERE code = 'FP-FQ' AND organization_id IS NULL;
SELECT id INTO fallback_micro_id FROM sample_types WHERE code = 'FP-MICRO' AND organization_id IS NULL;

-- 2. Update Samples to point to new Global Types
-- 2.1 Code Match
UPDATE samples s
SET sample_type_id = new_types.id
FROM sample_types old_types
JOIN sample_types new_types ON 
    new_types.organization_id IS NULL 
    AND upper(old_types.code) = upper(new_types.code)
WHERE s.sample_type_id = old_types.id
AND old_types.organization_id IS NOT NULL; 

-- 2.2 Name Match
UPDATE samples s
SET sample_type_id = new_types.id
FROM sample_types old_types
JOIN sample_types new_types ON 
    new_types.organization_id IS NULL
    AND upper(old_types.name) = upper(new_types.name)
WHERE s.sample_type_id = old_types.id
AND old_types.organization_id IS NOT NULL;

-- 2.3 FALLBACK: Map remaining based on category (Aggressive Cleanup)
-- If we can't match code/name, map to generic based on category
UPDATE samples s
SET sample_type_id = CASE 
    WHEN old_types.test_category = 'microbiological' THEN fallback_micro_id
    ELSE fallback_fq_id
    END
FROM sample_types old_types
WHERE s.sample_type_id = old_types.id
AND old_types.organization_id IS NOT NULL;


-- 3. Update Product Specifications (Same Logic)
-- 3.1 Code Match
UPDATE product_specifications ps
SET sample_type_id = new_types.id
FROM sample_types old_types
JOIN sample_types new_types ON 
    new_types.organization_id IS NULL 
    AND upper(old_types.code) = upper(new_types.code)
WHERE ps.sample_type_id = old_types.id
AND old_types.organization_id IS NOT NULL; 

-- 3.2 Name Match
UPDATE product_specifications ps
SET sample_type_id = new_types.id
FROM sample_types old_types
JOIN sample_types new_types ON 
    new_types.organization_id IS NULL
    AND upper(old_types.name) = upper(new_types.name)
WHERE ps.sample_type_id = old_types.id
AND old_types.organization_id IS NOT NULL;

-- 3.3 Fallback
UPDATE product_specifications ps
SET sample_type_id = CASE 
    WHEN old_types.test_category = 'microbiological' THEN fallback_micro_id
    ELSE fallback_fq_id
    END
FROM sample_types old_types
WHERE ps.sample_type_id = old_types.id
AND old_types.organization_id IS NOT NULL;


-- 4. Delete old scoped types
DELETE FROM sample_types 
WHERE organization_id IS NOT NULL;

-- 5. Alter Table to remove tenant scoping columns permanently
ALTER TABLE sample_types DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE sample_types DROP COLUMN IF EXISTS plant_id CASCADE;

END $$;

-- 6. Update RLS
ALTER TABLE sample_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON sample_types;
CREATE POLICY "Enable read access for all users" ON sample_types
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenant Isolation" ON sample_types;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sample_types;
DROP POLICY IF EXISTS "Enable update for users based on email" ON sample_types;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON sample_types;
DROP POLICY IF EXISTS "Enable write for system admins only" ON sample_types;

CREATE POLICY "Enable write for system admins only" ON sample_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'system_owner'
        )
    );
