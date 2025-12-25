-- ISO/IEC 17025 & 21 CFR Part 11 Compliance Remediation
-- This migration adds missing audit triggers to critical tables identified during the audit execution.

-- QMS Module Triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_nonconformities') THEN
        CREATE TRIGGER audit_nonconformities AFTER INSERT OR UPDATE OR DELETE ON public.nonconformities FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_capa') THEN
        CREATE TRIGGER audit_capa AFTER INSERT OR UPDATE OR DELETE ON public.capa_actions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_8d') THEN
        CREATE TRIGGER audit_8d AFTER INSERT OR UPDATE OR DELETE ON public.eight_d_reports FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_nc_attachments') THEN
        CREATE TRIGGER audit_nc_attachments AFTER INSERT OR UPDATE OR DELETE ON public.nc_attachments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
END $$;

-- Raw Materials & Traceability Triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_suppliers') THEN
        CREATE TRIGGER audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_raw_materials') THEN
        CREATE TRIGGER audit_raw_materials AFTER INSERT OR UPDATE OR DELETE ON public.raw_materials FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_rm_lots') THEN
        CREATE TRIGGER audit_rm_lots AFTER INSERT OR UPDATE OR DELETE ON public.raw_material_lots FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_rm_checks') THEN
        CREATE TRIGGER audit_rm_checks AFTER INSERT OR UPDATE OR DELETE ON public.raw_material_checks FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
END $$;

-- Reporting & Documentation Triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_gen_reports') THEN
        CREATE TRIGGER audit_gen_reports AFTER INSERT OR UPDATE OR DELETE ON public.generated_reports FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
    END IF;
END $$;

-- Comment for record keeping
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for compliance (21 CFR Part 11, ISO 17025)';
