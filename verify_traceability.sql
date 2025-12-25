-- Verification Script for Traceability Engine
-- Run this in SQL Editor to verify triggers

DO $$
DECLARE
    v_org_id UUID;
    v_plant_id UUID;
    v_user_id UUID;
    
    v_rm_id UUID;
    v_rm_lot_id UUID;
    
    v_pack_id UUID;
    v_pack_lot_id UUID;
    
    v_inter_id UUID;
    v_batch_id UUID;
    v_sample_id UUID;
BEGIN
    -- 1. Setup Context (Get first org/plant)
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    SELECT id INTO v_plant_id FROM plants WHERE organization_id = v_org_id LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- 2. Create Raw Material & Lot
    INSERT INTO raw_materials (organization_id, name, code) 
    VALUES (v_org_id, 'Test RM', 'TRM-01') 
    RETURNING id INTO v_rm_id;
    
    INSERT INTO raw_material_lots (organization_id, raw_material_id, lot_code, quantity_received, quantity_remaining)
    VALUES (v_org_id, v_rm_id, 'LOT-RM-001', 100, 100)
    RETURNING id INTO v_rm_lot_id;
    
    -- 3. Create Packaging & Lot
    INSERT INTO packaging_materials (organization_id, plant_id, name, code)
    VALUES (v_org_id, v_plant_id, 'Test Pack', 'TPK-01')
    RETURNING id INTO v_pack_id;
    
    INSERT INTO packaging_lots (organization_id, plant_id, packaging_material_id, lot_code, quantity)
    VALUES (v_org_id, v_plant_id, v_pack_id, 'LOT-PK-001', 500)
    RETURNING id INTO v_pack_lot_id;
    
    -- 4. Create Production Batch (Empty for now)
    INSERT INTO production_batches (organization_id, plant_id, batch_code, product_id, planned_quantity)
    VALUES (v_org_id, v_plant_id, 'BATCH-001', NULL, 1000) -- assuming product_id nullable or we need a product
    RETURNING id INTO v_batch_id;
    
    -- 5. Create Intermediate Product (Linked to Batch)
    INSERT INTO intermediate_products (organization_id, plant_id, production_batch_id, code, volume)
    VALUES (v_org_id, v_plant_id, v_batch_id, 'INTER-001', 500)
    RETURNING id INTO v_inter_id;
    
    -- 6. Add Ingredient to Intermediate (Trigger 1: RM -> Inter)
    INSERT INTO intermediate_ingredients (organization_id, plant_id, intermediate_product_id, raw_material_lot_id, quantity)
    VALUES (v_org_id, v_plant_id, v_inter_id, v_rm_lot_id, 10);
    
    -- 7. Record Packaging Usage (Trigger 3: Pack -> Batch)
    INSERT INTO batch_packaging_usage (organization_id, plant_id, production_batch_id, packaging_lot_id, quantity_used)
    VALUES (v_org_id, v_plant_id, v_batch_id, v_pack_lot_id, 50);

    -- 8. Create Sample (Trigger 4: Batch -> Sample)
    INSERT INTO samples (organization_id, plant_id, production_batch_id, code, status)
    VALUES (v_org_id, v_plant_id, v_batch_id, 'SAMPLE-001', 'pending')
    RETURNING id INTO v_sample_id;
    
    -- RAISE NOTICE to check results manually in output or check traceability_chain table
END;
$$;

-- Verify Results
SELECT 
    source_type, 
    target_type, 
    COUNT(*) as link_count 
FROM traceability_chain 
WHERE recorded_at > NOW() - INTERVAL '1 minute'
GROUP BY source_type, target_type;
