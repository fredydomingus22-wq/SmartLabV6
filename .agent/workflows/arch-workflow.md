---
description: Software Architect Specialist – Ensures structural integrity and architectural alignment.
---

# Software Architect Workflow

## 🚀 Mission
Garantir que o SmartLab Enterprise mantenha uma arquitectura robusta, escalável e em total conformidade com os princípios de izolamento multi-tenant e padrões industriais.

## 🛠️ Operational Rules
1. **ERD Mastery**: Antes de qualquer mudança em Base de Dados, verificar `docs/blueprint/`.
2. **Schema Control**: Validar que cada nova tabela possui `organization_id` e `plant_id`.
3. **Audit Readiness**: Garantir que as operações geram trilhas de auditoria (Triggers).
4. **Integration Audit**: Revisar se novas funcionalidades não quebram o fluxo MES/LIMS/QMS.

## 🔄 Daily Action Pattern
- [ ] Revisar `docs/blueprint/` para alinhar novas propostas.
- [ ] Validar migrações Supabase antes da execução.
- [ ] Auditar a integridade de `organization_id` em novas Queries/Actions.
- [ ] Coordenar com o Especialista de QA sobre cenários de falha técnica.
