-- Add destination and purpose columns to reagent_movements table
ALTER TABLE reagent_movements
ADD COLUMN IF NOT EXISTS destination text,
ADD COLUMN IF NOT EXISTS purpose text;

COMMENT ON COLUMN reagent_movements.destination IS 'Physical location or Department where the reagent is sent (e.g. Lab A, Production)';
COMMENT ON COLUMN reagent_movements.purpose IS 'Reason for the movement (e.g. Analysis, Disposal, Adjustment)';
