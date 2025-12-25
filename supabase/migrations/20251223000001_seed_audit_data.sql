-- Seed Data for Audit Module
-- ISO 9001:2015 Internal Audit Checklist

DO $$
DECLARE
    org_id UUID;
    checklist_id UUID;
    section_id UUID;
BEGIN
    -- Get first organization
    SELECT id INTO org_id FROM public.organizations LIMIT 1;
    
    IF org_id IS NOT NULL THEN
        -- 1. Create Checklist Template
        INSERT INTO public.audit_checklists (organization_id, name, description, version)
        VALUES (org_id, 'ISO 9001:2015 - Sistema de Gestão da Qualidade', 'Checklist completa para auditoria interna de conformidade com a norma ISO 9001:2015.', '2015.1')
        RETURNING id INTO checklist_id;
        
        -- 2. Sections and Questions
        
        -- Section 1: Contexto da Organização (Clause 4)
        INSERT INTO public.audit_checklist_sections (checklist_id, name, order_index)
        VALUES (checklist_id, 'Contexto da Organização (Cláusula 4)', 1)
        RETURNING id INTO section_id;
        
        INSERT INTO public.audit_checklist_questions (section_id, question_text, requirement_reference, order_index)
        VALUES 
        (section_id, 'A organização determinou as questões externas e internas relevantes para o seu propósito e direção estratégica?', '4.1', 1),
        (section_id, 'Foram identificadas as partes interessadas e os seus requisitos relevantes para o SGQ?', '4.2', 2),
        (section_id, 'O âmbito do SGQ está determinado, documentado e disponível?', '4.3', 3);
        
        -- Section 2: Liderança (Clause 5)
        INSERT INTO public.audit_checklist_sections (checklist_id, name, order_index)
        VALUES (checklist_id, 'Liderança (Cláusula 5)', 2)
        RETURNING id INTO section_id;
        
        INSERT INTO public.audit_checklist_questions (section_id, question_text, requirement_reference, order_index)
        VALUES 
        (section_id, 'A Gestão de Topo demonstra liderança e compromisso em relação ao SGQ?', '5.1.1', 1),
        (section_id, 'A Política da Qualidade está estabelecida, implementada e mantida?', '5.2', 2),
        (section_id, 'As responsabilidades e autoridades para papéis relevantes são atribuídas e comunicadas?', '5.3', 3);
        
        -- Section 3: Planeamento (Clause 6)
        INSERT INTO public.audit_checklist_sections (checklist_id, name, order_index)
        VALUES (checklist_id, 'Planeamento (Cláusula 6)', 3)
        RETURNING id INTO section_id;
        
        INSERT INTO public.audit_checklist_questions (section_id, question_text, requirement_reference, order_index)
        VALUES 
        (section_id, 'Foram determinadas as ações para abordar riscos e oportunidades?', '6.1', 1),
        (section_id, 'Os objetivos da qualidade são mensuráveis e coerentes com a política?', '6.2', 2);
        
        -- Section 4: Apoio (Clause 7)
        INSERT INTO public.audit_checklist_sections (checklist_id, name, order_index)
        VALUES (checklist_id, 'Apoio e Recursos (Cláusula 7)', 4)
        RETURNING id INTO section_id;
        
        INSERT INTO public.audit_checklist_questions (section_id, question_text, requirement_reference, order_index)
        VALUES 
        (section_id, 'Os recursos necessários para o SGQ foram determinados e providenciados?', '7.1', 1),
        (section_id, 'Os equipamentos de medição são calibrados ou verificados a intervalos especificados?', '7.1.5', 2),
        (section_id, 'A organização determinou a competência necessária das pessoas que realizam trabalho sob o seu controlo?', '7.2', 3),
        (section_id, 'A informação documentada requerida pela norma está controlada?', '7.5', 4);

        -- Section 5: Operação (Clause 8)
        INSERT INTO public.audit_checklist_sections (checklist_id, name, order_index)
        VALUES (checklist_id, 'Operação (Cláusula 8)', 5)
        RETURNING id INTO section_id;
        
        INSERT INTO public.audit_checklist_questions (section_id, question_text, requirement_reference, order_index)
        VALUES 
        (section_id, 'O planeamento e controlo operacional são realizados de acordo com os requisitos?', '8.1', 1),
        (section_id, 'As saídas não conformes são controladas para prevenir o seu uso não pretendido?', '8.7', 2);

        -- Section 6: Melhoria (Clause 10)
        INSERT INTO public.audit_checklist_sections (checklist_id, name, order_index)
        VALUES (checklist_id, 'Melhoria (Cláusula 10)', 6)
        RETURNING id INTO section_id;
        
        INSERT INTO public.audit_checklist_questions (section_id, question_text, requirement_reference, order_index)
        VALUES 
        (section_id, 'A organização reage a não conformidades e toma ações para as controlar e corrigir?', '10.2', 1),
        (section_id, 'A organização melhora continuamente a adequação e eficácia do SGQ?', '10.3', 2);
        
    END IF;
END $$;
