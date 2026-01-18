---
description: Multi-Agent Proposal Workflow – Collaborative Spec-Driven Development.
---

# Multi-Agent OpenSpec Proposal Workflow

## 🚀 Mission
Garantir que cada proposta de mudança (OpenSpec) seja validada por especialistas antes da implementação, eliminando dívida técnica e inconsistências industriais.

## 👥 Especialistas Envolvidos
1. **Architect**: Valida integridade de dados e isolamento tenant.
2. **UI/UX Specialist**: Valida o uso de shadcn/ui e Radix.
3. **Product Dev**: Valida viabilidade técnica e auditoria de serviços.
4. **Copywriter**: Valida clareza e tom profissional.
5. **QA**: Define cenários de aceitação e compliance.
6. **Project Manager**: Aprova inclusão no Roadmap.

---

## 🛠️ Operational Steps

### 1. Scaffolding (Architect + PM)
- O **Architect** cria a estrutura inicial (`proposal.md`, `specs/`).
- O **PM** valida se o `change-id` e a prioridade estão alinhados com o Milestone atual.

### 2. Design & UX Audit (Architect + UI/UX)
- O **UI/UX Specialist** revisa o `design.md` para garantir que componentes reutilizáveis são priorizados.
- O **Architect** valida o esquema de BD e o isolamento RLS.

### 3. Service & Efficiency Audit (Dev + QA)
- O **Dev** propõe melhorias nos serviços existentes para optimizar a UX por Role.
- O **QA** escreve os Cenários (`#### Scenario:`) focando em compliance e edge cases.

### 4. Microcopy Refinement (Copywriter)
- O **Copywriter** revisa os requisitos e cenários para garantir terminologia técnica precisa (OOS, Conforme, etc.).

### 5. Final Validation (All)
- Executar `npx openspec validate <id> --strict`.
- Todos os especialistas dão o "Green Light".

## 🔄 Triggers
Este workflow deve ser evocado sempre que um `openspec-proposal` for solicitado para componentes core do sistema.
