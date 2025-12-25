-- Document Management System (DMS) Module
-- This migration creates tables for controlling Master Documents (SOPs, Methods, Specs)

-- Document Categories
CREATE TABLE IF NOT EXISTS public.doc_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL, -- SOP, MTD, SPC, FRM, PLY
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(organization_id, code)
);

-- Documents (The "Container" for versions)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    category_id UUID NOT NULL REFERENCES public.doc_categories(id),
    
    title VARCHAR(255) NOT NULL,
    doc_number VARCHAR(50) NOT NULL, -- Internal Reference Code
    owner_id UUID REFERENCES auth.users(id),
    
    current_version_id UUID, -- Reference to document_versions(id) added later
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(organization_id, doc_number)
);

-- Document Versions
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    
    version_number VARCHAR(20) NOT NULL,
    change_description TEXT,
    
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, review, approved, published, superseded, archived
    
    file_path TEXT, -- Storage path
    file_type VARCHAR(50),
    file_size BIGINT,
    
    effective_date DATE,
    expiry_date DATE,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id)
);

-- Add foreign key in documents now that document_versions exists
ALTER TABLE public.documents 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (current_version_id) 
REFERENCES public.document_versions(id) 
ON DELETE SET NULL;

-- Document Approvals (Workflow/Workflow)
CREATE TABLE IF NOT EXISTS public.document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES auth.users(id),
    
    role VARCHAR(20) NOT NULL DEFAULT 'approver', -- reviewer, approver
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    
    comments TEXT,
    signed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.doc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view doc_categories in their org"
    ON public.doc_categories FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view documents in their org"
    ON public.documents FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view document_versions in their org"
    ON public.document_versions FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view document_approvals in their org"
    ON public.document_approvals FOR SELECT
    USING (version_id IN (SELECT id FROM public.document_versions WHERE organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())));

-- Helper Indexes
CREATE INDEX IF NOT EXISTS idx_docs_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_approvals_version ON public.document_approvals(version_id);

-- Default Seed for Categories
INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Standard Operating Procedure', 'SOP', 'Procedimentos Operacionais Normatizados' FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Analytical Method', 'MTD', 'Métodos Analíticos de Laboratório' FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Product Specification', 'SPC', 'Especificações de Matéria-Prima e Produto Final' FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Quality Form', 'FRM', 'Formulários e Registos de Qualidade' FROM public.organizations
ON CONFLICT DO NOTHING;
