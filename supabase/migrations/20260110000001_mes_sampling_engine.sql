-- Migration: MES Sampling Engine Foundations
-- Supports automated and manual sampling with state-aware reminders.

-- 1. Sampling Plans (Configuration)
CREATE TABLE IF NOT EXISTS public.production_sampling_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    sample_type_id UUID NOT NULL REFERENCES public.sample_types(id),
    
    frequency_minutes INTEGER NOT NULL DEFAULT 60,
    trigger_on_start BOOLEAN DEFAULT TRUE,
    trigger_on_shift_change BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    
    UNIQUE(plant_id, product_id, sample_type_id)
);

ALTER TABLE public.production_sampling_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sampling plans in their org" ON public.production_sampling_plans FOR SELECT USING (organization_id = public.get_my_org_id());

-- 2. State-aware Reminders (Runtime)
CREATE TABLE IF NOT EXISTS public.production_sampling_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    
    production_batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
    sampling_plan_id UUID NOT NULL REFERENCES public.production_sampling_plans(id) ON DELETE CASCADE,
    
    last_sample_id UUID REFERENCES public.samples(id) ON DELETE SET NULL,
    last_sample_at TIMESTAMPTZ,
    next_sample_due_at TIMESTAMPTZ NOT NULL,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'suppressed')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

ALTER TABLE public.production_sampling_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sampling reminders in their org" ON public.production_sampling_reminders FOR SELECT USING (organization_id = public.get_my_org_id());

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sampling_reminders_batch ON public.production_sampling_reminders(production_batch_id);
CREATE INDEX IF NOT EXISTS idx_sampling_reminders_due ON public.production_sampling_reminders(next_sample_due_at) WHERE status = 'pending';
