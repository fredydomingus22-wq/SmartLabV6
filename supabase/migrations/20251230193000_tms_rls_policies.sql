-- Migration to add missing RLS policies for Training Management System (TMS) tables
-- Standardizes tenant isolation and role-based access

-- 1. training_modules
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in org can view modules" ON public.training_modules;
CREATE POLICY "Anyone in org can view modules" ON public.training_modules
    FOR SELECT USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Admins can manage modules" ON public.training_modules;
CREATE POLICY "Admins can manage modules" ON public.training_modules
    FOR ALL USING (
        (public.is_admin_or_manager() OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'quality'
        )) AND 
        organization_id = public.get_my_org_id()
    );

-- 2. training_plans
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in org can view plans" ON public.training_plans;
CREATE POLICY "Anyone in org can view plans" ON public.training_plans
    FOR SELECT USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Admins can manage plans" ON public.training_plans;
CREATE POLICY "Admins can manage plans" ON public.training_plans
    FOR ALL USING (
        (public.is_admin_or_manager() OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'quality'
        )) AND 
        organization_id = public.get_my_org_id()
    );

-- 3. training_plan_modules
ALTER TABLE public.training_plan_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in org can view plan modules" ON public.training_plan_modules;
CREATE POLICY "Anyone in org can view plan modules" ON public.training_plan_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.training_plans
            WHERE id = plan_id AND organization_id = public.get_my_org_id()
        )
    );

DROP POLICY IF EXISTS "Admins can manage plan modules" ON public.training_plan_modules;
CREATE POLICY "Admins can manage plan modules" ON public.training_plan_modules
    FOR ALL USING (
        (public.is_admin_or_manager() OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'quality'
        )) AND
        EXISTS (
            SELECT 1 FROM public.training_plans
            WHERE id = plan_id AND organization_id = public.get_my_org_id()
        )
    );

-- 4. training_quizzes
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in org can view quizzes" ON public.training_quizzes;
CREATE POLICY "Anyone in org can view quizzes" ON public.training_quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.training_modules
            WHERE id = module_id AND organization_id = public.get_my_org_id()
        )
    );

DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.training_quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.training_quizzes
    FOR ALL USING (
        (public.is_admin_or_manager() OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'quality'
        )) AND
        EXISTS (
            SELECT 1 FROM public.training_modules
            WHERE id = module_id AND organization_id = public.get_my_org_id()
        )
    );

-- 5. quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in org can view questions" ON public.quiz_questions;
CREATE POLICY "Anyone in org can view questions" ON public.quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.training_quizzes q
            JOIN public.training_modules m ON m.id = q.module_id
            WHERE q.id = quiz_id AND m.organization_id = public.get_my_org_id()
        )
    );

DROP POLICY IF EXISTS "Admins can manage questions" ON public.quiz_questions;
CREATE POLICY "Admins can manage questions" ON public.quiz_questions
    FOR ALL USING (
        (public.is_admin_or_manager() OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'quality'
        )) AND
        EXISTS (
            SELECT 1 FROM public.training_quizzes q
            JOIN public.training_modules m ON m.id = q.module_id
            WHERE q.id = quiz_id AND m.organization_id = public.get_my_org_id()
        )
    );

-- 6. quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.training_assignments
            WHERE id = assignment_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can insert own attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.training_assignments
            WHERE id = assignment_id AND user_id = auth.uid()
        )
    );

-- 7. Update training_assignments policies to include 'system_owner' and use helper where possible
DROP POLICY IF EXISTS "QA can view all training" ON public.training_assignments;
CREATE POLICY "TMS Managers can manage all training" ON public.training_assignments
    FOR ALL USING (
        (public.is_admin_or_manager() OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'quality'
        )) AND
        organization_id = public.get_my_org_id()
    );
