-- Add Capacity columns to Equipments table
-- The equipment actions and UI expect 'capacity' and 'capacity_unit' columns.

ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS capacity NUMERIC,
ADD COLUMN IF NOT EXISTS capacity_unit TEXT;
