-- Migration: Decoupled Sampling Architecture (MES-LIMS Bridge)
-- Date: 2026-01-10
-- Description: Adds sampling plans and requests to decouple production events from lab execution.

-- 1. Ensure Production Orders existence (if not already captured in migrations)
CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID REFERENCES public.plants(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    code TEXT NOT NULL,
    planned_quantity NUMERIC NOT NULL,
    unit TEXT DEFAULT 'un',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')),
    start_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plant_id, code)
);

-- 2. Ensure Production Events existence
CREATE TABLE IF NOT EXISTS public.production_events (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID REFERENCES public.plants(id),
    production_batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'start', 'resume', 'pause', 'stop', 'sampling_triggered'
    performed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update Sampling Plans (Evolution of Configuration)
CREATE TABLE IF NOT EXISTS public.production_sampling_plans (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plant_id UUID REFERENCES public.plants(id),
    product_id UUID REFERENCES public.products(id), -- Nullable for global plans
    sample_type_id UUID NOT NULL REFERENCES public.sample_types(id),
    
    name TEXT,
    description TEXT,
    
    trigger_type TEXT NOT NULL DEFAULT 'event_based' CHECK (trigger_type IN ('time_based', 'event_based', 'manual')),
    frequency_minutes INTEGER,
    event_anchor TEXT CHECK (event_anchor IN ('batch_start', 'batch_end', 'shift_change', 'process_step')),
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table already existed (idempotency)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_sampling_plans' AND column_name = 'trigger_type') THEN
        ALTER TABLE public.production_sampling_plans ADD COLUMN trigger_type TEXT NOT NULL DEFAULT 'event_based' CHECK (trigger_type IN ('time_based', 'event_based', 'manual'));
        ALTER TABLE public.production_sampling_plans ADD COLUMN event_anchor TEXT CHECK (event_anchor IN ('batch_start', 'batch_end', 'shift_change', 'process_step'));
        ALTER TABLE public.production_sampling_plans ADD COLUMN name TEXT;
        ALTER TABLE public.production_sampling_plans ADD COLUMN description TEXT;
        ALTER TABLE public.production_sampling_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Sample Requests (The New Bridge Entity)
CREATE TABLE IF NOT EXISTS public.sample_requests (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES public.plants(id) ON DELETE CASCADE,
    
    sampling_plan_id UUID REFERENCES public.production_sampling_plans(id) ON DELETE SET NULL,
    production_batch_id UUID REFERENCES public.production_batches(id) ON DELETE CASCADE,
    production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
    
    -- Ticket Info
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'critical')),
    
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    collected_at TIMESTAMPTZ, -- Set when the physical Sample is created
    
    metadata JSONB DEFAULT '{}'
);

-- 5. Extend Samples to link back to Request
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'samples' AND column_name = 'sample_request_id') THEN
        ALTER TABLE public.samples ADD COLUMN sample_request_id UUID REFERENCES public.sample_requests(id);
    END IF;
END $$;

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_sampling_plans_product ON public.production_sampling_plans(product_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_batch ON public.sample_requests(production_batch_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON public.sample_requests(status);
CREATE INDEX IF NOT EXISTS idx_samples_request_id ON public.samples(sample_request_id);

-- 7. RLS Enforcement
ALTER TABLE public.production_sampling_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sampling plans in their org" ON public.production_sampling_plans
    FOR SELECT USING (organization_id = public.get_my_org_id());

CREATE POLICY "Users can view sample requests in their org" ON public.sample_requests
    FOR SELECT USING (organization_id = public.get_my_org_id());

-- 8. Audit Triggers
-- production_sampling_plans already has a trigger in common core audit but we ensure name consistency if needed
DROP TRIGGER IF EXISTS audit_sampling_plans ON public.production_sampling_plans;
CREATE TRIGGER audit_sampling_plans AFTER INSERT OR UPDATE OR DELETE ON public.production_sampling_plans FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_sample_requests AFTER INSERT OR UPDATE OR DELETE ON public.sample_requests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
