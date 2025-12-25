-- 1. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL, -- INS, UPD, DEL
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS for Audit: Read Only
CREATE POLICY "Users can view audit logs in their org" ON public.audit_logs FOR SELECT USING (organization_id = public.get_my_org_id());

-- 3. Audit Trigger Function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_oid UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    if (TG_OP = 'INSERT') then
        v_new_data = to_jsonb(NEW);
        v_oid = NEW.organization_id;
    elsif (TG_OP = 'UPDATE') then
        v_old_data = to_jsonb(OLD);
        v_new_data = to_jsonb(NEW);
        v_oid = NEW.organization_id;
    elsif (TG_OP = 'DELETE') then
        v_old_data = to_jsonb(OLD);
        v_oid = OLD.organization_id;
    end if;

    INSERT INTO public.audit_logs (organization_id, table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (v_oid, TG_TABLE_NAME::TEXT, coalesce(NEW.id, OLD.id), TG_OP, v_old_data, v_new_data, auth.uid());
    
    RETURN NULL;
END;
$$ language 'plpgsql' security definer;

-- 4. Apply Triggers
-- Organizations
CREATE TRIGGER audit_orgs AFTER INSERT OR UPDATE OR DELETE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
-- Plants
CREATE TRIGGER audit_plants AFTER INSERT OR UPDATE OR DELETE ON public.plants FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
-- User Profiles
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Production
CREATE TRIGGER audit_prod_lines AFTER INSERT OR UPDATE OR DELETE ON public.production_lines FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_batches AFTER INSERT OR UPDATE OR DELETE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_intermediate AFTER INSERT OR UPDATE OR DELETE ON public.intermediate_products FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_ingredients AFTER INSERT OR UPDATE OR DELETE ON public.intermediate_ingredients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- LIMS
CREATE TRIGGER audit_params AFTER INSERT OR UPDATE OR DELETE ON public.qa_parameters FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_sample_types AFTER INSERT OR UPDATE OR DELETE ON public.sample_types FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_samples AFTER INSERT OR UPDATE OR DELETE ON public.samples FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_analysis AFTER INSERT OR UPDATE OR DELETE ON public.lab_analysis FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
