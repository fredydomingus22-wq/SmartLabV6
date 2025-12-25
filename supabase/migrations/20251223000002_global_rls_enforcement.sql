-- Global RLS Enforcement Migration (Revised)
-- This migration ensures every table has a full set of CRUD policies (SELECT, INSERT, UPDATE, DELETE)
-- strictly isolated by organization_id using the get_my_org_id() helper.

-- 1. Add organization_id to dependent tables that lack it
DO $$
BEGIN
    -- Audit Checklist Sections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_checklist_sections' AND column_name = 'organization_id') THEN
        ALTER TABLE public.audit_checklist_sections ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.audit_checklist_sections s SET organization_id = c.organization_id FROM public.audit_checklists c WHERE s.checklist_id = c.id;
        ALTER TABLE public.audit_checklist_sections ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- Audit Checklist Questions (Dependent on Sections)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_checklist_questions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.audit_checklist_questions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.audit_checklist_questions q SET organization_id = s.organization_id FROM public.audit_checklist_sections s WHERE q.section_id = s.id;
        ALTER TABLE public.audit_checklist_questions ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- Audit Responses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_responses' AND column_name = 'organization_id') THEN
        ALTER TABLE public.audit_responses ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.audit_responses r SET organization_id = a.organization_id FROM public.audits a WHERE r.audit_id = a.id;
        ALTER TABLE public.audit_responses ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- Audit Findings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_findings' AND column_name = 'organization_id') THEN
        ALTER TABLE public.audit_findings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.audit_findings f SET organization_id = a.organization_id FROM public.audits a WHERE f.audit_id = a.id;
        ALTER TABLE public.audit_findings ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- CIP Program Steps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cip_program_steps' AND column_name = 'organization_id') THEN
        ALTER TABLE public.cip_program_steps ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.cip_program_steps s SET organization_id = p.organization_id FROM public.cip_programs p WHERE s.program_id = p.id;
        ALTER TABLE public.cip_program_steps ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- CIP Execution Steps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cip_execution_steps' AND column_name = 'organization_id') THEN
        ALTER TABLE public.cip_execution_steps ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.cip_execution_steps s SET organization_id = e.organization_id FROM public.cip_executions e WHERE s.execution_id = e.id;
        ALTER TABLE public.cip_execution_steps ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- HACCP PRP Items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'haccp_prp_items' AND column_name = 'organization_id') THEN
        ALTER TABLE public.haccp_prp_items ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.haccp_prp_items i SET organization_id = t.organization_id FROM public.haccp_prp_templates t WHERE i.template_id = t.id;
        ALTER TABLE public.haccp_prp_items ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- HACCP PRP Answers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'haccp_prp_answers' AND column_name = 'organization_id') THEN
        ALTER TABLE public.haccp_prp_answers ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.haccp_prp_answers a SET organization_id = e.organization_id FROM public.haccp_prp_executions e WHERE a.execution_id = e.id;
        ALTER TABLE public.haccp_prp_answers ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- 2. Apply Global RLS Policies
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'production_lines', 'products', 'production_batches', 'intermediate_products', 
        'intermediate_ingredients', 'equipments', 'samples', 'lab_analysis', 
        'qa_parameters', 'sample_types', 'micro_media_types', 'micro_media_lots', 
        'micro_incubators', 'micro_test_sessions', 'micro_results', 'nonconformities', 
        'capa_actions', 'eight_d_reports', 'nc_attachments', 'qms_audit_log', 
        'generated_reports', 'audit_logs', 'reagents', 'reagent_movements', 
        'suppliers', 'raw_materials', 'raw_material_lots', 'raw_material_checks', 
        'haccp_hazards', 'pcc_logs', 'prp_executions', 'cip_programs', 
        'cip_program_steps', 'cip_executions', 'cip_execution_steps',
        'training_records', 'analyst_qualifications', 'employees', 'teams', 
        'shifts', 'attendance_logs', 'sampling_points', 'product_specifications',
        'qa_parameter_history', 'specification_history', 'audits', 'audit_checklists',
        'audit_checklist_sections', 'audit_checklist_questions', 'audit_responses',
        'audit_findings', 'haccp_prp_templates', 'haccp_prp_items', 
        'haccp_prp_executions', 'haccp_prp_answers'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Standard SELECT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard INSERT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard UPDATE" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard DELETE" ON public.%I', t);
        
        -- Drop other possible policy names
        EXECUTE format('DROP POLICY IF EXISTS "Users can view %I in their org" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view %I in their organization" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert %I in their org" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update %I in their org" ON public.%I', t, t);
        
        -- Create standard policies
        EXECUTE format('CREATE POLICY "Standard SELECT" ON public.%I FOR SELECT USING (organization_id = public.get_my_org_id())', t);
        EXECUTE format('CREATE POLICY "Standard INSERT" ON public.%I FOR INSERT WITH CHECK (organization_id = public.get_my_org_id())', t);
        EXECUTE format('CREATE POLICY "Standard UPDATE" ON public.%I FOR UPDATE USING (organization_id = public.get_my_org_id()) WITH CHECK (organization_id = public.get_my_org_id())', t);
        EXECUTE format('CREATE POLICY "Standard DELETE" ON public.%I FOR DELETE USING (organization_id = public.get_my_org_id())', t);
    END LOOP;
END $$;

-- 3. Special cases
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization" ON public.organizations FOR SELECT USING (id = public.get_my_org_id());

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
