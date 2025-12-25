-- Add relational link to equipments for Tank/Silo
ALTER TABLE intermediate_products 
ADD COLUMN equipment_id UUID REFERENCES equipments(id),
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index for faster lookups
CREATE INDEX idx_intermediate_products_equipment ON intermediate_products(equipment_id);

-- Update RLS if necessary (existing policies usually cover organization_id)
-- Ensure 'review' is a valid status for production_batches if it's an enum (it's text in schema, likely application controlled, but good to check constraints if any)
-- Assuming status is text based on previous view of database.ts
