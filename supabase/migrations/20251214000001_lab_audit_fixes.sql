-- Lab Module Audit Fixes
-- Fixes critical issues identified in audit:
-- 1. Unique constraint for sample + parameter
-- 2. INSERT/UPDATE RLS policies for lab_analysis

-- 1. Unique Constraint: One result per sample per parameter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_sample_parameter'
    ) THEN
        ALTER TABLE public.lab_analysis 
        ADD CONSTRAINT unique_sample_parameter 
        UNIQUE (sample_id, qa_parameter_id);
    END IF;
END $$;

-- 2. RLS Policies for lab_analysis INSERT/UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can insert analysis in their org'
        AND tablename = 'lab_analysis'
    ) THEN
        CREATE POLICY "Users can insert analysis in their org" 
        ON public.lab_analysis 
        FOR INSERT 
        WITH CHECK (organization_id = public.get_my_org_id());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update own analysis'
        AND tablename = 'lab_analysis'
    ) THEN
        CREATE POLICY "Users can update own analysis" 
        ON public.lab_analysis 
        FOR UPDATE 
        USING (analyzed_by = auth.uid())
        WITH CHECK (organization_id = public.get_my_org_id());
    END IF;
END $$;

-- 3. RLS Policies for samples INSERT/UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can insert samples in their org'
        AND tablename = 'samples'
    ) THEN
        CREATE POLICY "Users can insert samples in their org" 
        ON public.samples 
        FOR INSERT 
        WITH CHECK (organization_id = public.get_my_org_id());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update samples in their org'
        AND tablename = 'samples'
    ) THEN
        CREATE POLICY "Users can update samples in their org" 
        ON public.samples 
        FOR UPDATE 
        USING (organization_id = public.get_my_org_id())
        WITH CHECK (organization_id = public.get_my_org_id());
    END IF;
END $$;
