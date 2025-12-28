DO $$
DECLARE
    v_org_id UUID;
    v_plant_id UUID;
    v_rm_lot_id UUID;
    v_inter_id UUID;
    v_trace_count INTEGER;
BEGIN
    -- 1. Setup (Reuse existing IDs if possible, or select random valid pair)
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    SELECT id INTO v_plant_id FROM plants WHERE organization_id = v_org_id LIMIT 1;

    -- Pick a raw material lot and intermediate product (created in previous test or existing)
    SELECT id INTO v_rm_lot_id FROM raw_material_lots WHERE organization_id = v_org_id LIMIT 1;
    
    -- Create dummy intermediate for testing
    INSERT INTO production_batches (organization_id, plant_id, code, product_id, production_line_id, planned_quantity)
    SELECT v_org_id, v_plant_id, 'BATCH-FIX-TEST', product_id, production_line_id, 100
    FROM production_batches LIMIT 1
    RETURNING id INTO v_inter_id; -- Just recycling variable name for batch ID

    -- Create Intermediate Product
    INSERT INTO intermediate_products (organization_id, plant_id, production_batch_id, code, volume, unit)
    VALUES (v_org_id, v_plant_id, v_inter_id, 'INTER-FIX-TEST', 100, 'L')
    RETURNING id INTO v_inter_id;

    -- TEST 1: INSERT
    INSERT INTO intermediate_ingredients (organization_id, plant_id, intermediate_product_id, raw_material_lot_id, raw_material_lot_code, quantity, unit)
    VALUES (v_org_id, v_plant_id, v_inter_id, v_rm_lot_id, 'TEST-LOT', 10, 'kg');

    -- Check INSERT
    IF NOT EXISTS (SELECT 1 FROM traceability_chain WHERE source_id = v_rm_lot_id AND target_id = v_inter_id AND quantity = 10) THEN
        RAISE EXCEPTION 'INSERT failed to populate traceability chain';
    END IF;

    -- TEST 2: UPDATE
    UPDATE intermediate_ingredients 
    SET quantity = 20
    WHERE intermediate_product_id = v_inter_id AND raw_material_lot_id = v_rm_lot_id;
    
    -- Check UPDATE
    IF NOT EXISTS (SELECT 1 FROM traceability_chain WHERE source_id = v_rm_lot_id AND target_id = v_inter_id AND quantity = 20) THEN
         RAISE EXCEPTION 'UPDATE failed to update traceability chain';
    END IF;

    -- TEST 3: DELETE
    DELETE FROM intermediate_ingredients 
    WHERE intermediate_product_id = v_inter_id AND raw_material_lot_id = v_rm_lot_id;

    -- Check DELETE
    IF EXISTS (SELECT 1 FROM traceability_chain WHERE source_id = v_rm_lot_id AND target_id = v_inter_id) THEN
         RAISE EXCEPTION 'DELETE failed to remove traceability chain link';
    END IF;

    RAISE NOTICE 'ALL TESTS PASSED';
END;
$$;
