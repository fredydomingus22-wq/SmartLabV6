-- Create material_consumptions table for RF-MAT-002 Traceability
CREATE TABLE IF NOT EXISTS material_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    plant_id UUID,
    
    raw_material_lot_id UUID NOT NULL REFERENCES raw_material_lots(id),
    production_order_id UUID REFERENCES production_orders(id), -- Link to Production Order
    production_batch_id UUID REFERENCES production_batches(id), -- Specific Batch Link
    
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consumed_by UUID REFERENCES auth.users(id),
    
    reason TEXT, -- e.g., 'Production', 'Sampling', 'Spillage'
    notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_consumptions_lot_id ON material_consumptions(raw_material_lot_id);
CREATE INDEX IF NOT EXISTS idx_material_consumptions_prod_order_id ON material_consumptions(production_order_id);
CREATE INDEX IF NOT EXISTS idx_material_consumptions_prod_batch_id ON material_consumptions(production_batch_id);

-- RLS Policies
ALTER TABLE material_consumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for organization users" ON material_consumptions
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Enable insert access for organization users" ON material_consumptions
    FOR INSERT
    WITH CHECK (organization_id = (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

-- Update function to handle consumption atomically + traceability
CREATE OR REPLACE FUNCTION consume_material_lot_v2(
    p_lot_id UUID,
    p_quantity NUMERIC,
    p_production_order_id UUID,
    p_production_batch_id UUID,
    p_user_id UUID,
    p_reason TEXT,
    p_notes TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lot_quantity NUMERIC;
    v_new_quantity NUMERIC;
    v_lot_status TEXT;
    v_org_id UUID;
    v_plant_id UUID;
    v_unit TEXT;
    v_consumption_id UUID;
BEGIN
    -- 1. Lock Lot Row and Get Info
    SELECT quantity_remaining, status, organization_id, plant_id, unit
    INTO v_lot_quantity, v_lot_status, v_org_id, v_plant_id, v_unit
    FROM raw_material_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lot not found';
    END IF;

    -- 2. Validate Status
    IF v_lot_status != 'approved' AND v_lot_status != 'in_use' THEN
        RAISE EXCEPTION 'Lot is not approved for use (Status: %)', v_lot_status;
    END IF;

    -- 3. Validate Quantity
    IF p_quantity > v_lot_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_lot_quantity, p_quantity;
    END IF;

    -- 4. Update Lot
    v_new_quantity := v_lot_quantity - p_quantity;
    
    UPDATE raw_material_lots
    SET quantity_remaining = v_new_quantity,
        status = CASE WHEN v_new_quantity <= 0 THEN 'depleted' ELSE 'in_use' END,
        updated_at = NOW()
    WHERE id = p_lot_id;

    -- 5. Insert Consumption Record
    INSERT INTO material_consumptions (
        organization_id, plant_id, raw_material_lot_id, 
        production_order_id, production_batch_id, 
        quantity, unit, consumed_by, reason, notes
    ) VALUES (
        v_org_id, v_plant_id, p_lot_id,
        p_production_order_id, p_production_batch_id,
        p_quantity, v_unit, p_user_id, p_reason, p_notes
    ) RETURNING id INTO v_consumption_id;

    RETURN v_consumption_id;
END;
$$;
