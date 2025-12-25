-- Multi-Level Isolation Migration (Corrected V2)
-- Ensures both organization_id and plant_id are present in all tables for full tenant isolation.

-- 1. Create Helper Function for Plant ID
CREATE OR REPLACE FUNCTION public.get_my_plant_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT plant_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 2. Add plant_id to tables that lack it and backfill from parent records
DO $$
BEGIN
    -- analyst_qualifications: Backfill from employees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analyst_qualifications' AND column_name = 'plant_id') THEN
        ALTER TABLE public.analyst_qualifications ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.analyst_qualifications aq SET plant_id = e.plant_id FROM public.employees e WHERE aq.employee_id = e.id;
    END IF;

    -- attendance_logs: Backfill from employees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance_logs' AND column_name = 'plant_id') THEN
        ALTER TABLE public.attendance_logs ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.attendance_logs al SET plant_id = e.plant_id FROM public.employees e WHERE al.employee_id = e.id;
    END IF;

    -- training_records: Backfill from employees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'training_records' AND column_name = 'plant_id') THEN
        ALTER TABLE public.training_records ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.training_records tr SET plant_id = e.plant_id FROM public.employees e WHERE tr.employee_id = e.id;
    END IF;

    -- audit_checklists: Default to NULL (global templates)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_checklists' AND column_name = 'plant_id') THEN
        ALTER TABLE public.audit_checklists ADD COLUMN plant_id UUID REFERENCES public.plants(id);
    END IF;

    -- audit_checklist_sections: Backfill from audit_checklists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_checklist_sections' AND column_name = 'plant_id') THEN
        ALTER TABLE public.audit_checklist_sections ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.audit_checklist_sections s SET plant_id = c.plant_id FROM public.audit_checklists c WHERE s.checklist_id = c.id;
    END IF;

    -- audit_checklist_questions: Backfill from audit_checklist_sections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_checklist_questions' AND column_name = 'plant_id') THEN
        ALTER TABLE public.audit_checklist_questions ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.audit_checklist_questions q SET plant_id = s.plant_id FROM public.audit_checklist_sections s WHERE q.section_id = s.id;
    END IF;

    -- audit_responses: Backfill from audits
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_responses' AND column_name = 'plant_id') THEN
        ALTER TABLE public.audit_responses ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.audit_responses r SET plant_id = a.plant_id FROM public.audits a WHERE r.audit_id = a.id;
    END IF;

    -- audit_findings: Backfill from audits
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_findings' AND column_name = 'plant_id') THEN
        ALTER TABLE public.audit_findings ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.audit_findings f SET plant_id = a.plant_id FROM public.audits a WHERE f.audit_id = a.id;
    END IF;

    -- audit_logs: Backfill from user_profiles (logged-in user's plant) using 'changed_by'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'plant_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.audit_logs al SET plant_id = up.plant_id FROM public.user_profiles up WHERE al.changed_by = up.id;
    END IF;

    -- cip_program_steps: Backfill from cip_programs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cip_program_steps' AND column_name = 'plant_id') THEN
        ALTER TABLE public.cip_program_steps ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.cip_program_steps s SET plant_id = p.plant_id FROM public.cip_programs p WHERE s.program_id = p.id;
    END IF;

    -- cip_execution_steps: Backfill from cip_executions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cip_execution_steps' AND column_name = 'plant_id') THEN
        ALTER TABLE public.cip_execution_steps ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.cip_execution_steps s SET plant_id = e.plant_id FROM public.cip_executions e WHERE s.execution_id = e.id;
    END IF;

    -- haccp_prp_templates: Default to NULL (global templates)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'haccp_prp_templates' AND column_name = 'plant_id') THEN
        ALTER TABLE public.haccp_prp_templates ADD COLUMN plant_id UUID REFERENCES public.plants(id);
    END IF;

    -- haccp_prp_items: Backfill from haccp_prp_templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'haccp_prp_items' AND column_name = 'plant_id') THEN
        ALTER TABLE public.haccp_prp_items ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.haccp_prp_items i SET plant_id = t.plant_id FROM public.haccp_prp_templates t WHERE i.template_id = t.id;
    END IF;

    -- haccp_prp_answers: Backfill from haccp_prp_executions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'haccp_prp_answers' AND column_name = 'plant_id') THEN
        ALTER TABLE public.haccp_prp_answers ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.haccp_prp_answers a SET plant_id = e.plant_id FROM public.haccp_prp_executions e WHERE a.execution_id = e.id;
    END IF;

    -- nc_attachments: Backfill from nonconformities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'nc_attachments' AND column_name = 'plant_id') THEN
        ALTER TABLE public.nc_attachments ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.nc_attachments na SET plant_id = nc.plant_id FROM public.nonconformities nc WHERE na.nonconformity_id = nc.id;
    END IF;

    -- qms_audit_log: Backfill from user_profiles using 'changed_by'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'qms_audit_log' AND column_name = 'plant_id') THEN
        ALTER TABLE public.qms_audit_log ADD COLUMN plant_id UUID REFERENCES public.plants(id);
        UPDATE public.qms_audit_log ql SET plant_id = up.plant_id FROM public.user_profiles up WHERE ql.changed_by = up.id;
    END IF;
END $$;

-- 3. Update Global RLS Policies to enforce both Org and Plant isolation
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
        -- Drop existing standard policies
        EXECUTE format('DROP POLICY IF EXISTS "Standard SELECT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard INSERT" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard UPDATE" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Standard DELETE" ON public.%I', t);
        
        -- Create new multi-level policies
        EXECUTE format('CREATE POLICY "Standard SELECT" ON public.%I FOR SELECT USING (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
        EXECUTE format('CREATE POLICY "Standard INSERT" ON public.%I FOR INSERT WITH CHECK (
            organization_id = public.get_my_org_id() 
            AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
        EXECUTE format('CREATE POLICY "Standard UPDATE" ON public.%I FOR UPDATE USING (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        ) WITH CHECK (
            organization_id = public.get_my_org_id() 
            AND (plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
        EXECUTE format('CREATE POLICY "Standard DELETE" ON public.%I FOR DELETE USING (
            organization_id = public.get_my_org_id() 
            AND (plant_id IS NULL OR plant_id = public.get_my_plant_id() OR public.get_my_plant_id() IS NULL)
        )', t);
    END LOOP;
END $$;
