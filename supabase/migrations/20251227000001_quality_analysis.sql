-- Migration to support Quality Analysis persistence (Ishikawa, 5-Why, etc.)
CREATE TABLE IF NOT EXISTS public.quality_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    parameter_id UUID REFERENCES public.qa_parameters(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.production_batches(id) ON DELETE SET NULL,
    analysis_type TEXT NOT NULL, -- 'ishikawa', '5why', 'check_sheet', 'flowchart'
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.quality_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's quality analysis"
    ON public.quality_analysis FOR SELECT
    USING (organization_id = get_my_org_id());

CREATE POLICY "Users can insert quality analysis for their org"
    ON public.quality_analysis FOR INSERT
    WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "Users can update their organization's quality analysis"
    ON public.quality_analysis FOR UPDATE
    USING (organization_id = get_my_org_id());

-- Indices
CREATE INDEX idx_quality_analysis_target ON public.quality_analysis(product_id, parameter_id, batch_id);
CREATE INDEX idx_quality_analysis_type ON public.quality_analysis(analysis_type);
