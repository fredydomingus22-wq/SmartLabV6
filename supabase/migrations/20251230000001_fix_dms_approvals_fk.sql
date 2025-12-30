-- Fix missing foreign key relationship between document_approvals and user_profiles
-- This enables PostgREST to resolve the !approver_id hint

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_document_approvals_user_profiles' 
        AND table_name = 'document_approvals'
    ) THEN
        ALTER TABLE public.document_approvals
        ADD CONSTRAINT fk_document_approvals_user_profiles
        FOREIGN KEY (approver_id)
        REFERENCES public.user_profiles(id);
    END IF;
END $$;
