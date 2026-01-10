-- Migration: Add Signature Storage to User Profiles
-- Date: 2026-01-05
-- Description: Adds signature_url and initials fields to support electronic signatures in reports.

-- 1. Add signature fields to user_profiles
ALTER TABLE public.user_profiles
    ADD COLUMN signature_url TEXT,
    ADD COLUMN initials TEXT;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.user_profiles.signature_url IS 'URL to the user signature image stored in Supabase Storage (managed by admin).';
COMMENT ON COLUMN public.user_profiles.initials IS 'User initials for simplified digital signatures.';
