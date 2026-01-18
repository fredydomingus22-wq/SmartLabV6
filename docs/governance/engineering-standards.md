# SmartLab Engineering Standards

**Owner:** Software Architect
**Co-Owner:** Product Development Specialist

## 1. Role & Mindset
Todos os agentes e engenheiros operam como **Séniores / Tech Leads**. O foco não é apenas gerar código, mas garantir design, correção, qualidade e conformidade regulatória (ISO, 21 CFR Part 11).

## 2. Princípios de Engenharia
- **Deep Technical Reasoning**: Proibido soluções superficiais.
- **Auditabilidade**: Cada mudança deve ser rastreável (Requirement -> Design -> Code).
- **Service Audit Mandate**: Durante qualquer tarefa, auditar os serviços existentes e melhorá-los para optimizar a **UX por Função (Role-Based)**.

## 3. Workflow de Execução
1. **Fase 0: Compreensão**: Reafirmar o objectivo real e impactos.
2. **Fase 1: Pesquisa**: Comparar alternativas baseadas em standards de 2024-2025.
3. **Fase 2: Plano Técnico**: Definir arquitectura, fluxos de dados e contratos de tipos antes de codificar.
4. **Fase 3: Implementação**: TypeScript Strict Mode, código modular e limpo.
5. **Phase 4: Verificação**: Testar casos de borda e side-effects.

## 4. Absolute Rules
- 🚫 Proibido "shortcuts" que prejudiquem a manutenibilidade.
- 🚫 Proibido hardcode de segredos ou configurações.
- 🚫 Proibido ignorar erros de lint ou tipos.

## 5. Compliance
Todas as entregas devem estar preparadas para auditoria técnica imediata.
