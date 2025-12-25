-- Retest Workflow Migration
-- Adds support for result retesting with audit trail

-- 1. Add retest columns to lab_analysis
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lab_analysis' 
        AND column_name = 'is_retest'
    ) THEN
        ALTER TABLE public.lab_analysis ADD COLUMN is_retest BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lab_analysis' 
        AND column_name = 'supersedes_id'
    ) THEN
        ALTER TABLE public.lab_analysis ADD COLUMN supersedes_id UUID REFERENCES public.lab_analysis(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lab_analysis' 
        AND column_name = 'retest_reason'
    ) THEN
        ALTER TABLE public.lab_analysis ADD COLUMN retest_reason TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lab_analysis' 
        AND column_name = 'is_valid'
    ) THEN
        ALTER TABLE public.lab_analysis ADD COLUMN is_valid BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Create index for retest lookups
CREATE INDEX IF NOT EXISTS idx_lab_analysis_supersedes 
ON public.lab_analysis(supersedes_id) 
WHERE supersedes_id IS NOT NULL;

-- 3. Comment for documentation
COMMENT ON COLUMN public.lab_analysis.is_retest IS 'True if this result is a retest of a previous result';
COMMENT ON COLUMN public.lab_analysis.supersedes_id IS 'Reference to the original result that this one supersedes';
COMMENT ON COLUMN public.lab_analysis.retest_reason IS 'Reason for requesting the retest';
COMMENT ON COLUMN public.lab_analysis.is_valid IS 'False if this result has been superseded by a retest';
