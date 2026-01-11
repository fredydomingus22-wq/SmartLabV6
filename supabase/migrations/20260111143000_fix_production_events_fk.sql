-- Migration: Fix Production Events Foreign Key
-- Date: 2026-01-11
-- Description: Adds a specific foreign key to user_profiles to satisfy PostgREST relationship hint.

DO $$ 
BEGIN 
    -- Only add the constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'production_events_performed_by_fkey') THEN
        ALTER TABLE public.production_events
        ADD CONSTRAINT production_events_performed_by_fkey
        FOREIGN KEY (performed_by)
        REFERENCES public.user_profiles(id);
    END IF;
END $$;
