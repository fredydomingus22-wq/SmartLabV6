-- Ensure default document categories exist for all organizations
INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Standard Operating Procedure', 'SOP', 'Procedimentos Operacionais Normatizados' FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Analytical Method', 'MTD', 'Métodos Analíticos de Laboratório' FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Product Specification', 'SPC', 'Especificações de Matéria-Prima e Produto Final' FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO public.doc_categories (organization_id, name, code, description)
SELECT id, 'Quality Form', 'FRM', 'Formulários e Registos de Qualidade' FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;
