-- Migration: AI Insights Table
-- Purpose: Store AI-generated insights for lab results and other entities

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to the analyzed entity
    entity_type TEXT NOT NULL,  -- 'lab_analysis', 'sample', 'batch', etc.
    entity_id UUID NOT NULL,
    
    -- Insight details
    insight_type TEXT NOT NULL DEFAULT 'validation',  -- 'validation', 'anomaly', 'suggestion', 'prediction'
    status TEXT NOT NULL,  -- 'approved', 'warning', 'blocked', 'info'
    message TEXT,
    confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Full response for audit
    raw_response JSONB,
    
    -- Metadata
    model_used TEXT DEFAULT 'gpt-4o-mini',
    processing_time_ms INTEGER,
    
    -- Multi-tenant isolation
    organization_id UUID NOT NULL REFERENCES organizations(id),
    plant_id UUID REFERENCES plants(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for fast lookups
    CONSTRAINT valid_status CHECK (status IN ('approved', 'warning', 'blocked', 'info'))
);

-- Indexes for performance
CREATE INDEX idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
CREATE INDEX idx_ai_insights_org ON ai_insights(organization_id);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);

-- RLS Policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights for their organization"
    ON ai_insights FOR SELECT
    USING (organization_id = public.get_my_org_id());

CREATE POLICY "System can insert insights"
    ON ai_insights FOR INSERT
    WITH CHECK (organization_id = public.get_my_org_id());

COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and validations for lab data';
