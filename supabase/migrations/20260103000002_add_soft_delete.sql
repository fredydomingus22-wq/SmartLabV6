-- Add soft-delete columns to critical tables for industrial traceability
-- Affected tables: samples, lab_analysis, production_batches, products, qa_parameters, sampling_points

DO $$ 
BEGIN
    -- 1. samples
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'samples' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.samples ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.samples ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.samples ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 2. lab_analysis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_analysis' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.lab_analysis ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.lab_analysis ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.lab_analysis ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 3. production_batches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_batches' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.production_batches ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.production_batches ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.production_batches ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 4. products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.products ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.products ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.products ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 5. qa_parameters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qa_parameters' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.qa_parameters ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.qa_parameters ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.qa_parameters ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 6. sampling_points
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sampling_points' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.sampling_points ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.sampling_points ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.sampling_points ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 7. nonconformities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nonconformities' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.nonconformities ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.nonconformities ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.nonconformities ADD COLUMN deletion_reason TEXT;
    END IF;

    -- 8. capa_actions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'capa_actions' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.capa_actions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.capa_actions ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        ALTER TABLE public.capa_actions ADD COLUMN deletion_reason TEXT;
    END IF;
END $$;

-- Create indexes for performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_samples_deleted_at ON public.samples(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lab_analysis_deleted_at ON public.lab_analysis(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_batches_deleted_at ON public.production_batches(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qa_parameters_deleted_at ON public.qa_parameters(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sampling_points_deleted_at ON public.sampling_points(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nonconformities_deleted_at ON public.nonconformities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_capa_actions_deleted_at ON public.capa_actions(deleted_at) WHERE deleted_at IS NULL;

-- Audit Comment
COMMENT ON COLUMN public.samples.deleted_at IS 'Industrial compliance: Date of soft-deletion.';
COMMENT ON COLUMN public.samples.deletion_reason IS 'Mandatory reason for removing a regulated record.';
