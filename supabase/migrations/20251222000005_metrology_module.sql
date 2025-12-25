-- Phase 3: Metrology & Equipment Lifecycle

-- 1. Extend Equipments Table with Metrological metadata
ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS installation_date DATE,
ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS next_calibration_date DATE,
ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

-- 2. Maintenance Plans
CREATE TABLE public.maintenance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    
    task_name TEXT NOT NULL,
    description TEXT,
    frequency_days INTEGER NOT NULL, -- e.g. 90 for quarterly
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Maintenance & Calibration Logs
CREATE TABLE public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    
    performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    performed_by UUID REFERENCES public.user_profiles(id),
    
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'calibration', 'verification')),
    description TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'conditional')),
    
    notes TEXT,
    cost DECIMAL(10,2),
    attachment_url TEXT, -- Link to certificate or report
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Calibration Certificates (Specific for 17025 compliance)
CREATE TABLE public.calibration_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    
    certificate_number TEXT NOT NULL,
    issued_at DATE NOT NULL,
    expires_at DATE NOT NULL,
    issued_by TEXT NOT NULL, -- Laboratory name
    
    file_path TEXT,
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'superseded')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, certificate_number)
);

-- 5. RLS Policies
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View maintenance plans" ON public.maintenance_plans FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View maintenance logs" ON public.maintenance_logs FOR SELECT USING (organization_id = public.get_my_org_id());
CREATE POLICY "View calibration certificates" ON public.calibration_certificates FOR SELECT USING (organization_id = public.get_my_org_id());

-- 6. Audit Triggers
-- Check if audit_trigger_func exists before creating triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_func') THEN
        CREATE TRIGGER audit_maintenance_plans AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_plans FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
        CREATE TRIGGER audit_maintenance_logs AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_logs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
        CREATE TRIGGER audit_calibration_certificates AFTER INSERT OR UPDATE OR DELETE ON public.calibration_certificates FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
END $$;
