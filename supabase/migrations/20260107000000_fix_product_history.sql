-- Ensure product_history table exists and is structurally correct
CREATE TABLE IF NOT EXISTS public.product_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    
    -- Snapshot fields
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT,
    unit TEXT,
    shelf_life_days INTEGER,
    storage_conditions TEXT,
    
    -- Versioning fields
    version INTEGER NOT NULL,
    change_reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    superseded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Users can view product history in their org" ON public.product_history;
CREATE POLICY "Users can view product history in their org" 
ON public.product_history FOR SELECT 
USING (organization_id = public.get_my_org_id());

-- Trigger Function
CREATE OR REPLACE FUNCTION public.handle_product_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log history if version changed or specific fields changed important for quality
    -- However, usually we trust the application to increment version when it wants a history record.
    -- Or we can force it on every update.
    -- Let's log on every update where version changes OR if we assume strictly app-driven versioning.
    
    -- If the new version is greater than old version, we archive the OLD record
    IF NEW.version > OLD.version THEN
        INSERT INTO public.product_history (
            product_id,
            organization_id,
            name,
            sku,
            description,
            category,
            status,
            unit,
            shelf_life_days,
            storage_conditions,
            version,
            change_reason,
            changed_by,
            superseded_at
        ) VALUES (
            OLD.id,
            OLD.organization_id,
            OLD.name,
            OLD.sku,
            OLD.description,
            OLD.category,
            OLD.status,
            OLD.unit,
            OLD.shelf_life_days,
            OLD.storage_conditions,
            OLD.version,
            NEW.change_reason, -- We capture the reason provided in the UPDATE
            auth.uid(),
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_product_update_history ON public.products;
CREATE TRIGGER on_product_update_history
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_history();

-- Add missing columns to products if they don't exist (idempotent)
-- We saw these in the UI code, so they must exist or be intended.
-- 'version' and 'change_reason' (which might be transient or a column)
-- Typically 'change_reason' is a transient field in the update payload, but triggers can't access transient fields unless they are columns.
-- So we usually add 'change_reason' column to products, which is updated during the save, and the trigger reads it.

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.products ADD COLUMN version INTEGER DEFAULT 1;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN change_reason TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.products ADD COLUMN parent_id UUID REFERENCES public.products(id);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

     BEGIN
        ALTER TABLE public.products ADD COLUMN unit TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
     BEGIN
        ALTER TABLE public.products ADD COLUMN shelf_life_days INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
     BEGIN
        ALTER TABLE public.products ADD COLUMN category TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

     BEGIN
        ALTER TABLE public.products ADD COLUMN storage_conditions TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
