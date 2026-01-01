-- Migration to allow polymorphic equipment references in intermediate_products
-- This resolves the FK violation when selecting tanks from the specialized 'tanks' table

ALTER TABLE intermediate_products DROP CONSTRAINT IF EXISTS intermediate_products_equipment_id_fkey;

-- We keep the column as a UUID reference, but without the hard constraint to 'equipments'
-- as the system is moving towards specialized asset tables.
