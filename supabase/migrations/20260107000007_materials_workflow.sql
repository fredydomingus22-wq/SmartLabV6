-- Add status tracking for 3-level qualification
ALTER TABLE published.suppliers 
ADD COLUMN IF NOT EXISTS qualification_status text DEFAULT 'draft' CHECK (qualification_status IN ('draft', 'pending', 'qualified', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS current_stage integer DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 3),
ADD COLUMN IF NOT EXISTS level_1_approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS level_1_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS level_2_approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS level_2_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS level_3_approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS level_3_approved_at timestamptz;

ALTER TABLE published.raw_materials
ADD COLUMN IF NOT EXISTS qualification_status text DEFAULT 'draft' CHECK (qualification_status IN ('draft', 'pending', 'qualified', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS current_stage integer DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 3);

-- Create Approvals Log Table for Suppliers
CREATE TABLE IF NOT EXISTS published.supplier_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid REFERENCES published.suppliers(id) ON DELETE CASCADE,
    stage integer NOT NULL CHECK (stage BETWEEN 1 AND 3),
    status text NOT NULL CHECK (status IN ('approved', 'rejected')),
    comments text,
    reviewed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    organization_id uuid NOT NULL
);

-- Create Approvals Log Table for Materials
CREATE TABLE IF NOT EXISTS published.material_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid REFERENCES published.raw_materials(id) ON DELETE CASCADE,
    stage integer NOT NULL CHECK (stage BETWEEN 1 AND 3),
    status text NOT NULL CHECK (status IN ('approved', 'rejected')),
    comments text,
    reviewed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    organization_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE published.supplier_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE published.material_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified for now - strictly based on org)
CREATE POLICY "Users can view approvals in their org" ON published.supplier_approvals
    FOR SELECT USING (organization_id = (SELECT organization_id FROM published.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert approvals in their org" ON published.supplier_approvals
    FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM published.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view mateiral approvals in their org" ON published.material_approvals
    FOR SELECT USING (organization_id = (SELECT organization_id FROM published.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert material approvals in their org" ON published.material_approvals
    FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM published.user_profiles WHERE user_id = auth.uid()));
