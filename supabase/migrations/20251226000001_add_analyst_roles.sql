-- Add analyst roles for specialized lab and micro permissions
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'lab_analyst';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'micro_analyst';

-- Also add other roles from navigation.ts that may be missing
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'quality';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'haccp';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'warehouse';
