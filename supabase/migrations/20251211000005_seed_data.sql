-- 1. Create Organization (PepsiCo)
INSERT INTO public.organizations (id, name, slug, plan)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PepsiCo Global', 'pepsico-global', 'enterprise')
ON CONFLICT DO NOTHING;

-- 2. Create Plant (SmartLab Pilot Factory)
INSERT INTO public.plants (id, organization_id, name, code, timezone)
VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pilot Factory 01', 'PF01', 'America/New_York')
ON CONFLICT DO NOTHING;

-- 3. Create Production Line
INSERT INTO public.production_lines (id, organization_id, plant_id, name, code, status)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'High Speed Line 1', 'L01', 'active')
ON CONFLICT DO NOTHING;

-- 4. Create Product
INSERT INTO public.products (id, organization_id, plant_id, name, sku, status)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Coke Zero 500ml', 'CZ-500', 'active')
ON CONFLICT DO NOTHING;

-- 5. Create "Golden Batch"
INSERT INTO public.production_batches (id, organization_id, plant_id, product_id, production_line_id, code, status, planned_quantity)
VALUES
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'PB-2025-101', 'open', 50000)
ON CONFLICT DO NOTHING;

-- 6. Create Intermediate Product (Tank A)
INSERT INTO public.intermediate_products (id, organization_id, plant_id, production_batch_id, code, status, volume)
VALUES
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Tank A', 'pending', 10000)
ON CONFLICT DO NOTHING;

-- 7. Create QA Parameter (Brix) -- FIXED UUID: '10...' instead of 'g0...'
INSERT INTO public.qa_parameters (id, organization_id, plant_id, name, code, unit, category)
VALUES
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Brix', 'BRIX', '°Bx', 'physico-chemical')
ON CONFLICT DO NOTHING;
