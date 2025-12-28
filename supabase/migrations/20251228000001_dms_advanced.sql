-- Industrial DMS Refinement Migration
-- Focus: Periodic Review and Training Integration

-- 1. Enhanced Categories: Support parent/child for folder structure
ALTER TABLE public.doc_categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.doc_categories(id);

-- 2. Reading Logs (Training Tracking)
-- Tracks when a user acknowledges reading a specific document version
CREATE TABLE IF NOT EXISTS public.doc_reading_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    version_id UUID NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature_hash TEXT, -- Electronic signature proof
    
    UNIQUE(version_id, user_id)
);

-- 3. Periodic Reviews
-- Ensures documents are reviewed on a recurring schedule (e.g., every 1 or 2 years)
CREATE TABLE IF NOT EXISTS public.doc_periodic_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    
    scheduled_date DATE NOT NULL,
    performed_at TIMESTAMPTZ,
    performed_by UUID REFERENCES auth.users(id),
    
    result VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, pass_no_change, revision_needed
    comments TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.doc_reading_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_periodic_reviews ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view their own reading logs"
    ON public.doc_reading_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Managers can view all reading logs in org"
    ON public.doc_reading_logs FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view periodic reviews in their org"
    ON public.doc_periodic_reviews FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 6. Helper Functions for Hierarchy
CREATE OR REPLACE FUNCTION get_category_path(category_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    path TEXT;
BEGIN
    WITH RECURSIVE category_tree AS (
        SELECT id, name, parent_id, name::TEXT as full_path
        FROM public.doc_categories
        WHERE id = category_uuid
        
        UNION ALL
        
        SELECT c.id, c.name, c.parent_id, c.name || ' > ' || ct.full_path
        FROM public.doc_categories c
        INNER JOIN category_tree ct ON c.id = ct.parent_id
    )
    SELECT full_path INTO path FROM category_tree ORDER BY length(full_path) DESC LIMIT 1;
    RETURN path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
