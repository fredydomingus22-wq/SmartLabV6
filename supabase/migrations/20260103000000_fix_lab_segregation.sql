-- Migration: Fix Lab/Micro Segregation via RLS
-- Date: 2026-01-03
-- Objective: Restrict SAMPLE visibility based on Analyst Role and Test Category

-- 1. Optimized Functions for Role Checks (Avoid repeating subqueries)
CREATE OR REPLACE FUNCTION public.is_lab_analyst() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role = 'lab_analyst'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_micro_analyst() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role = 'micro_analyst'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Samples Policy
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Standard SELECT samples" ON public.samples;
DROP POLICY IF EXISTS "Segregated SELECT samples" ON public.samples;

CREATE POLICY "Segregated SELECT samples" ON public.samples
FOR SELECT USING (
    organization_id = public.get_my_org_id()
    AND (
        -- 1. Admins, Managers, System Owners see ALL
        public.is_admin_or_manager() 
        OR public.is_system_owner()
        OR
        -- 2. Lab Analysts: See Non-Micro samples (Physico-chemical, Sensory, Both?)
        -- 'Both' implies shared, so Lab can see. Strict Micro is hidden.
        (
            public.is_lab_analyst()
            AND EXISTS (
                SELECT 1 FROM public.sample_types st
                WHERE st.id = samples.sample_type_id
                AND st.test_category != 'microbiological'
            )
        )
        OR
        -- 3. Micro Analysts: See ONLY Micro samples (and maybe 'Both'?)
        -- Typically Micro needs to see samples marked as Micro.
        (
            public.is_micro_analyst()
            AND EXISTS (
                SELECT 1 FROM public.sample_types st
                WHERE st.id = samples.sample_type_id
                AND st.test_category IN ('microbiological', 'both')
            )
        )
        OR
        -- 4. Fallback: Users with no specific analytic role (e.g. read-only basic users)
        -- might be restricted or allowed. Assuming 'user' sees nothing or everything?
        -- Keeping safe: if not caught above, NO ACCESS to samples unless logic extended.
        -- BUT: We need to allow creation flow return?
        -- For now, strict segregation.
        FALSE
    )
);

-- 3. Ensure INSERT/UPDATE policies also respect segregation or rely on Service Layer?
-- Service Layer "Fortress" handles Write logic. RLS guards Read logic (Leakage).
-- We leave specific INSERT/UPDATE policies as defined in 'unified_rls_policies' 
-- but ensuring they check org is critical. 
-- Ideally, standard INSERT policy just checks Org. Service checks Role.
