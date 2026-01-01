-- Enterprise Training Management System (TMS) Schema
-- Inspired by MasterControl - Supports Curriculums, Quizzes, and Document Integration

-- 1. Training Modules (The content)
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('document', 'video', 'quiz', 'external')),
    content_url TEXT, -- For video/external
    document_id UUID REFERENCES public.documents(id), -- Nullable, links to DMS
    document_version TEXT, -- Specific version if stuck to one, else latest
    duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Quizzes (Assessments)
CREATE TABLE IF NOT EXISTS public.training_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
    passing_score INTEGER DEFAULT 80,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false')),
    options JSONB NOT NULL, -- Array of { "id": "1", "text": "Option A", "is_correct": true }
    points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0
);

-- 3. Training Plans / Curriculums (Job Roles)
CREATE TABLE IF NOT EXISTS public.training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    description TEXT,
    job_titles TEXT[], -- Array of Job Titles (e.g. ['Lab Analyst', 'QA Manager'])
    recurrence_interval INTERVAL, -- e.g. '1 year'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_plan_modules (
    plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
    sequence_order INTEGER DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (plan_id, module_id)
);

-- 4. Training Assignments (The execution)
CREATE TABLE IF NOT EXISTS public.training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Fix: Correct reference
    module_id UUID NOT NULL REFERENCES public.training_modules(id),
    plan_id UUID REFERENCES public.training_plans(id),
    
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed', 'overdue', 'void')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    score INTEGER, -- For quizzes
    certificate_id UUID, -- For generated certs
    
    -- Accountability / Verification
    time_spent_seconds INTEGER DEFAULT 0,
    signature_id UUID, -- Link to e-signature
    
    UNIQUE(user_id, module_id, assigned_at) -- Prevent dupes for same assignment cycle
);

-- 5. Quiz Attempts (Detailed logs)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.training_assignments(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    passed BOOLEAN,
    answers JSONB -- Store user answers for audit
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_assignments_user ON public.training_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_status ON public.training_assignments(status);
CREATE INDEX IF NOT EXISTS idx_training_modules_doc ON public.training_modules(document_id);

-- RLS Policies (Basic)
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users can view own training" ON public.training_assignments
    FOR SELECT USING (auth.uid() = user_id);

-- QA/Admins can view all
CREATE POLICY "QA can view all training" ON public.training_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'qa_manager', 'quality')
        )
    );

-- Trigger Function: Auto-assign on Document Approval (DRAFT CONCEPT - Requires Application Logic or complex PLPGSQL)
-- Implementation Strategy: Application Layer (Server Action) handles this to allow for cleaner logic.
