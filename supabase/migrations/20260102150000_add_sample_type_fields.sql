-- Add retention_time_days and default_sla_minutes to sample_types

ALTER TABLE "sample_types" 
ADD COLUMN IF NOT EXISTS "retention_time_days" integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS "default_sla_minutes" integer DEFAULT 2880; -- 48 hours default

COMMENT ON COLUMN "sample_types"."retention_time_days" IS 'Default retention time in days for samples of this type';
COMMENT ON COLUMN "sample_types"."default_sla_minutes" IS 'Default Service Level Agreement time in minutes for analysis completion';
