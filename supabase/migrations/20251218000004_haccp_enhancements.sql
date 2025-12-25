-- Add is_oprp to haccp_hazards
ALTER TABLE haccp_hazards ADD COLUMN IF NOT EXISTS is_oprp BOOLEAN DEFAULT FALSE;

-- PRP Templates table
CREATE TABLE IF NOT EXISTS haccp_prp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    plant_id UUID REFERENCES plants(id),
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'per_shift'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRP Items (Checklist questions/tasks)
CREATE TABLE IF NOT EXISTS haccp_prp_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES haccp_prp_templates(id) ON DELETE CASCADE,
    item_text TEXT NOT NULL,
    item_type TEXT DEFAULT 'pass_fail', -- 'pass_fail', 'numeric', 'text'
    expected_value TEXT,
    sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRP Executions (Log of a checklist run)
CREATE TABLE IF NOT EXISTS haccp_prp_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES haccp_prp_templates(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    plant_id UUID REFERENCES plants(id),
    executed_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'completed', -- 'in_progress', 'completed', 'verified'
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRP Answers (Individual item results)
CREATE TABLE IF NOT EXISTS haccp_prp_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES haccp_prp_executions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES haccp_prp_items(id),
    value TEXT NOT NULL, -- 'PASS', 'FAIL', or numeric/text value
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE haccp_prp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE haccp_prp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE haccp_prp_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE haccp_prp_answers ENABLE ROW LEVEL SECURITY;

-- Template Policies
CREATE POLICY "PRP templates are visible to organization members"
ON haccp_prp_templates FOR SELECT
TO authenticated
USING (organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage PRP templates"
ON haccp_prp_templates FOR ALL
TO authenticated
USING (
    organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) 
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'qa_manager')
);

-- Items Policies (Inherit from template visibility)
CREATE POLICY "PRP items are visible to organization members"
ON haccp_prp_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM haccp_prp_templates t
        WHERE t.id = haccp_prp_items.template_id
        AND t.organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Admins can manage PRP items"
ON haccp_prp_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM haccp_prp_templates t
        WHERE t.id = haccp_prp_items.template_id
        AND t.organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
        AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'qa_manager')
    )
);

-- Execution Policies
CREATE POLICY "Executions are visible to org members"
ON haccp_prp_executions FOR SELECT
TO authenticated
USING (organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert executions within their org"
ON haccp_prp_executions FOR INSERT
TO authenticated
WITH CHECK (organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Answer Policies
CREATE POLICY "Answers are visible to org members"
ON haccp_prp_answers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM haccp_prp_executions e
        WHERE e.id = haccp_prp_answers.execution_id
        AND e.organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert answers for their executions"
ON haccp_prp_answers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM haccp_prp_executions e
        WHERE e.id = haccp_prp_answers.execution_id
        AND e.organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    )
);
