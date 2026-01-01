-- Drop the restrictive Foreign Key on equipment_uid
-- This allows cip_executions to reference tanks, production_lines, and other tables, not just equipments.
ALTER TABLE public.cip_executions DROP CONSTRAINT IF EXISTS cip_executions_equipment_uid_fkey;

-- Add a comment to explain the polymorphic nature
COMMENT ON COLUMN public.cip_executions.equipment_uid IS 'Polymorphic ID referencing equipments, tanks, or production_lines';
