-- Migration: Traceability Hardening (Audit Finding D-01)
-- Date: 2026-01-03
-- Objective: Block Hard Deletes on critical traceability and compliance tables.

-- 1. batch_packaging_usage (Finding D-01)
DROP POLICY IF EXISTS "Standard DELETE batch_packaging_usage" ON public.batch_packaging_usage;
-- No replacement policy = Hard Delete is BLOCKED for everyone (including owners via RLS).
-- Only Superusers/Postgres role can bypass.

-- 2. Ensure other critical tables have no DELETE policy
-- (In Supabase, if no DELETE policy exists, it's denied by default if RLS is enabled)

-- Check and Drop standard delete policies for other sensitive tables if they exist
DROP POLICY IF EXISTS "Standard DELETE samples" ON public.samples;
DROP POLICY IF EXISTS "Standard DELETE lab_analysis" ON public.lab_analysis;
DROP POLICY IF EXISTS "Standard DELETE product_specifications" ON public.product_specifications;
DROP POLICY IF EXISTS "Standard DELETE production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "Standard DELETE intermediate_products" ON public.intermediate_products;

-- Note: We intentionally DO NOT provide a replacement policy for DELETE.
-- This enforces data immutability at the database level for all RLS-governed users.

-- 3. Restrict Audit Log modification (Already read-only in unified_rls_policies, but let's be safe)
DROP POLICY IF EXISTS "Standard DELETE audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Standard UPDATE audit_logs" ON public.audit_logs;
