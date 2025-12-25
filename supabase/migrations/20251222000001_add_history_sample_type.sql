-- Add sample_type_id to specification_history table
-- This mirrors the change in product_specifications to ensure historical data retains context

ALTER TABLE "public"."specification_history"
ADD COLUMN "sample_type_id" uuid REFERENCES "public"."sample_types"("id");

-- Update comment
COMMENT ON COLUMN "public"."specification_history"."sample_type_id" IS 'Links history record to a specific sample type (or null for finished product)';
