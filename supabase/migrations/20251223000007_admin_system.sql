-- Add system_owner role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'system_owner';

-- Add columns to organizations for plan management
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- active, suspended, archived

-- Create index for faster lookups if needed (optional but good)
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Update RLS to allow system_owner to see everything?
-- decision: NO, we will use Service Role in the Application Layer (Server Actions) for the Admin Dashboard.
-- This keeps the database policies strict for standard connections.
