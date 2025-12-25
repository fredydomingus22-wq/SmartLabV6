-- Seed default sample types for standard industrial use
-- Using the default organization/plant IDs found in existing data (or fetching them dynamically in a real app, 
-- but here we assume the single-tenant context for the main org).
-- Org: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- Plant: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22

INSERT INTO public.sample_types (organization_id, plant_id, name, code, test_category)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Intermediate Product', 'IP', 'both'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Raw Material', 'RM', 'both'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Water', 'WAT', 'both'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Environmental Monitoring', 'ENV', 'microbiological'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'CIP Rinse', 'CIP', 'physico_chemical')
ON CONFLICT (plant_id, code) DO NOTHING;
