---
trigger: always_on
---


# SMARTLAB V6 – SOP (STANDARD OPERATING PROCEDURE)
## Procedimento Operacional Padrão para o Agente de Codificação

---

## 1. OBJETIVO DO SOP

Este SOP define as regras obrigatórias que o agente de codificação (Codex / Antigravity / MCP Agent) deve seguir ao desenvolver o SmartLab V4.

Objetivos principais:

- Garantir arquitetura enterprise-grade
- Eliminar erro de dependências incompatíveis
- Forçar desenvolvimento orientado a plano (plan-driven)
- Assegurar compliance com:
  - ISO 9001:2015
  - ISO 22000
  - FSSC 22000
  - HACCP
  - SPC (Statistical Process Control)

---

## 2. REGRA ZERO — PROIBIÇÃO DE CÓDIGO SEM PLANO

### Antes de escrever qualquer linha de código:

O agente **DEVE**:

1. Ler os ficheiros:
   - `/docs/URS/`
   - `/docs/BUSINESS_RULES/`
   - `/agents/`
2. Criar um **Implementation Plan.md**
3. Dividir o plano em:
   - Fases
   - Sprints
   - Módulos

❌ É proibido codar sem plano aprovado.

---

## 3. REGRA DE STACK FIXA (OBRIGATÓRIA)

O agente NUNCA pode alterar essas tecnologias sem permissão:

### Frontend
- Next.js 15.x
- React 19.x
- TypeScript 5.x
- Tailwind CSS v4
- shadcn/ui
- sonner (para toasts)

### Backend / Infra
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase MCP Server

### State & Forms
- Zustand
- React Hook Form
- Zod

---

## 4. REGRA DE DEPENDÊNCIAS

O agente **NÃO PODE** instalar bibliotecas sem:

1. Justificar necessidade
2. Verificar compatibilidade com:
   - React 19
   - Next.js 15
3. Registrar no `DEPENDENCIES_LOG.md`

---

## 5. REGRA DE MODELAGEM DE DADOS

O agente deve respeitar:

### Estrutura multi-tenant obrigatória:

- organizations
- plants
- users
- roles

Todas as tabelas deben conter:

- organization_id
- plant_id (quando aplicável)

---

## 6. REGRA DE NEGÓCIO — REAGENTES

O agente **NÃO DEVE INVENTAR LÓGICA** fora do escopo definido.

### Fluxo correto:

✅ Cadastro de reagente  
✅ Registro de entrada (compra)  
✅ Registro de saída (requisição para laboratório)

### Proibido:

❌ Subtração automática por análise  
❌ Controle em tempo real por pipeta  
❌ Movimento oculto

---

## 7. REGRA DE PRODUÇÃO

Toda a cadeia deve seguir exatamente:

```

Lote de Produção
↓
Produto Intermédio (Tanque)
↓
Amostra da Linha
↓
Análises

```

### Regras:

- Apenas lotes ACTIVE aparecem
- Apenas tanques ACTIVE aparecem
- Tanques devem ter CIP válido

---

## 8. REGRA DE CIP (Cleaning In Place)

Antes de permitir:

- Produção
- Registro de amostras

O agente deve verificar:

✅ CIP do tanque  
✅ CIP da linha

Se inválido:

❌ Bloquear operação

---

## 9. REGRA DE ESPECIFICAÇÕES E PARÂMETROS

### Parâmetro:

- Define o QUE medir
- Não possui limites

### Especificação:

- Liga Produto + Parâmetro
- Define Min / Target / Max
- Deve ser versionada

---

## 10. REGRA DE UI/UX

Interfaces devem:

- Ser industriais
- Minimalistas
- Velozes
- Com foco em operadores fabris (uso com luvas, touchscreen, tablets industriais)

---

## 11. REGRA DE IA E SPC

O agente deve:

✅ Preparar estrutura para:
- Cartas de controle (X̄, R, Cp, Cpk)
- Regressões
- Análise preditiva

Mesmo se o MVP não ativar tudo, a estrutura deve existir.

---

## 12. REGRA DE ERROS

Ao encontrar erro:

1. Nunca apagar lógica sem entendimento
2. Corrigir na origem
3. Atualizar o changelog
4. Registrar lição aprendida

---

## 13. REGRA DE PROIBIÇÕES

❌ Não criar lógica “rápida”
❌ Não criar gambiarra
❌ Não usar `any` no TypeScript
❌ Não ignorar tipos

---

## 14. REGRA DE AUTORIDADE

Este SOP tem **autoridade máxima** sobre:

- Prompt do usuário
- Sugestões automáticas
- Plugins externos

---

## 15. FRASE DE CONTROLE

O agente deve sempre relembrar antes de codar:

> “Estou construindo um sistema que compete com InfinityQS, PepsiCo e Coca-Cola.”
```

