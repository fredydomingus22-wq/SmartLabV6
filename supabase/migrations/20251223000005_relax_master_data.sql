-- Relax Master Data Constraints
-- Allows plant_id to be NULL for master data tables, enabling "Global Records"

-- products
ALTER TABLE public.products ALTER COLUMN plant_id DROP NOT NULL;

-- qa_parameters
ALTER TABLE public.qa_parameters ALTER COLUMN plant_id DROP NOT NULL;

-- sample_types
ALTER TABLE public.sample_types ALTER COLUMN plant_id DROP NOT NULL;

-- micro_media_types
ALTER TABLE public.micro_media_types ALTER COLUMN plant_id DROP NOT NULL;

-- product_specifications
ALTER TABLE public.product_specifications ALTER COLUMN plant_id DROP NOT NULL;

-- haccp_hazards
ALTER TABLE public.haccp_hazards ALTER COLUMN plant_id DROP NOT NULL;
