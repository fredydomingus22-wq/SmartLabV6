CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_oid UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    if (TG_OP = 'INSERT') then
        v_new_data = to_jsonb(NEW);
        IF TG_TABLE_NAME = 'organizations' THEN
            v_oid = NEW.id;
        ELSE
            v_oid = NEW.organization_id;
        END IF;
    elsif (TG_OP = 'UPDATE') then
        v_old_data = to_jsonb(OLD);
        v_new_data = to_jsonb(NEW);
        IF TG_TABLE_NAME = 'organizations' THEN
            v_oid = NEW.id;
        ELSE
            v_oid = NEW.organization_id;
        END IF;
    elsif (TG_OP = 'DELETE') then
        v_old_data = to_jsonb(OLD);
        IF TG_TABLE_NAME = 'organizations' THEN
            v_oid = OLD.id;
        ELSE
            v_oid = OLD.organization_id;
        END IF;
    end if;

    INSERT INTO public.audit_logs (organization_id, table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (v_oid, TG_TABLE_NAME::TEXT, coalesce(NEW.id, OLD.id), TG_OP, v_old_data, v_new_data, auth.uid());
    
    RETURN NULL;
END;
$$ language 'plpgsql' security definer;
