-- Update the product history trigger function to include plant_id
CREATE OR REPLACE FUNCTION public.handle_product_history()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version > OLD.version THEN
        INSERT INTO public.product_history (
            product_id,
            organization_id,
            plant_id, -- Added this
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
            OLD.plant_id, -- Added this
            OLD.name,
            OLD.sku,
            OLD.description,
            OLD.category,
            OLD.status,
            OLD.unit,
            OLD.shelf_life_days,
            OLD.storage_conditions,
            OLD.version,
            NEW.change_reason,
            auth.uid(),
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
