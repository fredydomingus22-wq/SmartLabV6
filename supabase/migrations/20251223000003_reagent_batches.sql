-- Reagent Batches: Batch-level stock tracking for FIFO/FEFO
CREATE TABLE IF NOT EXISTS public.reagent_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID NOT NULL REFERENCES public.plants(id),
    reagent_id UUID NOT NULL REFERENCES public.reagents(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    initial_quantity NUMERIC NOT NULL,
    current_quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    received_date TIMESTAMPTZ DEFAULT now(),
    expiry_date DATE,
    supplier TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reagent_id, batch_number)
);

ALTER TABLE public.reagent_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reagent batches in their org"
    ON public.reagent_batches FOR SELECT
    USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can insert reagent batches in their org"
    ON public.reagent_batches FOR INSERT
    WITH CHECK (organization_id = public.get_my_org_id());

CREATE POLICY "Users can update reagent batches in their org"
    ON public.reagent_batches FOR UPDATE
    USING (organization_id = public.get_my_org_id());

-- Add batch reference to movements table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reagent_movements' AND column_name = 'reagent_batch_id'
    ) THEN
        ALTER TABLE public.reagent_movements 
        ADD COLUMN reagent_batch_id UUID REFERENCES public.reagent_batches(id);
    END IF;
END $$;

-- Index for efficient FIFO/FEFO queries
CREATE INDEX IF NOT EXISTS idx_reagent_batches_fifo 
    ON public.reagent_batches(reagent_id, expiry_date, received_date)
    WHERE status = 'active';

-- Audit trigger
DROP TRIGGER IF EXISTS reagent_batches_audit ON public.reagent_batches;
CREATE TRIGGER reagent_batches_audit
    AFTER INSERT OR UPDATE ON public.reagent_batches
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

COMMENT ON TABLE public.reagent_batches IS 'Batch-level stock tracking for reagents. Enables FIFO/FEFO consumption strategies.';
