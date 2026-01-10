-- Change changed_by FK to point to user_profiles to allow PostgREST joins
BEGIN;

-- 1. Product History
ALTER TABLE public.product_history 
DROP CONSTRAINT IF EXISTS product_history_changed_by_fkey;

ALTER TABLE public.product_history
ADD CONSTRAINT product_history_changed_by_fkey
FOREIGN KEY (changed_by)
REFERENCES public.user_profiles(id);

-- 2. Specification History
ALTER TABLE public.specification_history
DROP CONSTRAINT IF EXISTS specification_history_changed_by_fkey;

ALTER TABLE public.specification_history
ADD CONSTRAINT specification_history_changed_by_fkey
FOREIGN KEY (changed_by)
REFERENCES public.user_profiles(id);

COMMIT;
