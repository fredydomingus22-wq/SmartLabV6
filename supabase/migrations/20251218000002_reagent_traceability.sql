-- Add requested_by and external_supplier columns to reagent_movements table
ALTER TABLE reagent_movements
ADD COLUMN IF NOT EXISTS requested_by text,
ADD COLUMN IF NOT EXISTS external_supplier text;

COMMENT ON COLUMN reagent_movements.requested_by IS 'Name of the person requesting the consumption (e.g. Employee Name)';
COMMENT ON COLUMN reagent_movements.external_supplier IS 'Name of the external supplier for incoming stock (if different from default)';
