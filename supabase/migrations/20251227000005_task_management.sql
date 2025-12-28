-- Task Management System Database Schema
-- Unified table for tasks across all modules (QMS, Lab, Micro, etc.)

CREATE TABLE IF NOT EXISTS public.app_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
    
    -- Task Info
    title TEXT NOT NULL,
    description TEXT,
    
    -- Status & Priority
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Deadline
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Assignment
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Context (Which module/entity this task belongs to)
    module_context TEXT NOT NULL, -- 'qms_nc', 'qms_8d', 'lab_sample', 'micro_sample', 'maintenance', 'other'
    entity_id UUID, -- ID of the related NC, 8D, Sample, etc.
    entity_reference TEXT, -- e.g. 'NC-2025-001'
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view tasks in their organization"
    ON public.app_tasks FOR SELECT
    USING (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert tasks in their organization"
    ON public.app_tasks FOR INSERT
    WITH CHECK (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update tasks in their organization"
    ON public.app_tasks FOR UPDATE
    USING (organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_app_tasks_updated_at
    BEFORE UPDATE ON public.app_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indices for performance
CREATE INDEX idx_app_tasks_org ON public.app_tasks(organization_id);
CREATE INDEX idx_app_tasks_assignee ON public.app_tasks(assignee_id);
CREATE INDEX idx_app_tasks_status ON public.app_tasks(status);
CREATE INDEX idx_app_tasks_module ON public.app_tasks(module_context, entity_id);
CREATE INDEX idx_app_tasks_due ON public.app_tasks(due_date);
