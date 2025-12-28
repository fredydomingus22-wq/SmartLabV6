-- Fix app_tasks to reference user_profiles for easier UI joins
ALTER TABLE public.app_tasks 
DROP CONSTRAINT IF EXISTS app_tasks_assignee_id_fkey;

ALTER TABLE public.app_tasks 
ADD CONSTRAINT app_tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.app_tasks 
DROP CONSTRAINT IF EXISTS app_tasks_created_by_fkey;

ALTER TABLE public.app_tasks 
ADD CONSTRAINT app_tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;
