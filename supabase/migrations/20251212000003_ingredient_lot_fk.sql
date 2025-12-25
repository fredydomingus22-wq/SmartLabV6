-- Add proper FK to raw_material_lots table
-- This replaces the text-based lot_code with a proper UUID reference

-- Add the new FK column
ALTER TABLE public.intermediate_ingredients 
    ADD COLUMN raw_material_lot_id UUID REFERENCES public.raw_material_lots(id);

-- Create index for performance
CREATE INDEX idx_intermediate_ingredients_lot ON public.intermediate_ingredients(raw_material_lot_id);

-- Comment: The old raw_material_lot_code column is kept for backward compatibility
-- In production, you might want to migrate existing data and then drop the old column
