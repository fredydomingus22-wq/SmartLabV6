-- Add sample_type_id to product_specifications to allow phase-specific specs
ALTER TABLE "product_specifications"
ADD COLUMN "sample_type_id" UUID REFERENCES "sample_types" ("id") ON DELETE RESTRICT;

-- Update the Unique Constraint (Product + Parameter + SampleType must be unique)
-- First drop the existing constraint if it exists (usually idx_product_specs_unique or similar, checking definition)
-- Assuming the previous constraint was likely (product_id, qa_parameter_id)
ALTER TABLE "product_specifications"
DROP CONSTRAINT IF EXISTS "product_specifications_product_id_qa_parameter_id_key";

-- Add new constraint
ALTER TABLE "product_specifications"
ADD CONSTRAINT "product_specifications_unique_spec" 
UNIQUE ("product_id", "qa_parameter_id", "sample_type_id");

-- Comment
COMMENT ON COLUMN "product_specifications"."sample_type_id" IS 'The specific sample type (Process Phase) this spec applies to. If NULL, applies to Finished Product (default).';
