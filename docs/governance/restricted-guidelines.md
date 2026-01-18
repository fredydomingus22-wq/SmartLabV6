# SmartLab Restricted Scope Guidelines

**Owner:** Code Quality Specialist
**Co-Owner:** Project Manager

## 1. Objetivo
Actuar de forma cirúrgica. Limitar as alterações estritamente ao escopo da tarefa, minimizando impactos colaterais.

## 2. Regras de Proibição (Strict No-Touch)
1. **Não refatorar código adjacente** sem permissão ou justificativa de melhoria de serviço/UX.
2. **Não alterar formatação global** (manter o estilo existente).
3. **Não remover comentários ou logs** essenciais para auditoria.
4. **Não atualizar dependências** sem ordem explícita do Roadmap.

## 3. Protocolo de Modificação
- **Análise de Impacto**: Identificar o "Blast Radius". Se afetar múltiplos módulos industriais, pedir confirmação ao Arquiteto.
- **Alterações Mínimas Viáveis**: Resolver o problema com eficiência, sem reescritas desnecessárias, a menos que viole os standards.
- **Preservação de Interfaces**: Não quebrar contratos de tipos ou APIs públicas.

## 4. Auditoria e Desvios
Se encontrar erros críticos fora do escopo:
1. Finalizar a tarefa original.
2. Reportar a melhoria como nota separada para o **Project Manager**.
3. Se o desvio for de Copy/Microcopy, delegar para o **Copywriter Specialist**.
