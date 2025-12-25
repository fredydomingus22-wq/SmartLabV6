---
trigger: always_on
---

# SmartLab V4 – Business Rules (Global)
**Nível: Enterprise / PepsiCo / Coca-Cola Ready**

---

## 1. Visão Geral

O SmartLab V4 é um sistema integrado de:

- LIMS (Laboratory Information Management System)
- QMS (Quality Management System)
- FSMS (Food Safety Management System)

Projetado para:
- Rastreabilidade total
- Suporte à ISO 9001
- ISO 22000
- FSSC 22000
- HACCP
- SPC (Statistical Process Control)
- Análise Preditiva baseada em IA

---

## 2. Módulo de Reagentes

### 2.1. Objetivo

Controlar o cadastro de reagentes e os movimentos de entrada e saída entre armazém e laboratórios.

---

### 2.2. Entidades

#### 2.2.1. Reagent (Reagente)

Cadastro mestre.

**Campos obrigatórios:**
- name
- unit_of_measure (g, mL, L, kg, etc.)
- reagent_type
- organization_id
- plant_id

**Regras:**
- Um reagente pode ter múltiplas entradas.
- Um reagente pode ter múltiplas saídas.

---

#### 2.2.2. ReagentEntry (Entrada de Reagente)

Registro de compra/recebimento.

**Campos obrigatórios:**
- reagent_id
- entry_date
- quantity_received
- supplier (opcional)
- document_reference (opcional)

**Regras:**
- Incrementa o stock:
current_stock = current_stock + quantity_received

---

#### 2.2.3. ReagentIssue (Saída de Reagente)

Registro de envio ao laboratório.

**Campos obrigatórios:**
- reagent_id
- issue_date
- quantity_issued
- destination_lab
- requested_by

**Regras:**
- Decrementa o stock:
current_stock = current_stock - quantity_issued

- Se stock insuficiente: bloquear ou alertar.

---

## 3. Produção – Modelo de Dados

### 3.1. ProductionBatch (Lote de Produção)

Representa um lote de produção.

**Campos:**
- batch_code
- product_id
- planned_start_date
- status:
- PENDING
- ACTIVE
- CLOSED

**Regras:**
- Apenas lotes ACTIVE aparecem para registro de amostras.

---

### 3.2. IntermediateProduct (Produto Intermédio / Tanque)

Representa misturas intermediárias em tanques.

**Campos:**
- batch_id
- tank_id
- intermediate_type
- status:
- PENDING
- ACTIVE
- CLOSED

**Regras:**
- Apenas os ACTIVE podem ser usados para amostras.
- PENDING e CLOSED não aparecem na coleta.

---

### 3.3. RawMaterialLot (Lote de Matéria-Prima)

Representa matéria-prima recebida.

**Campos:**
- lot_code
- supplier
- reception_date
- status:
- APPROVED
- REJECTED
- QUARANTINE

**Regras:**
- Apenas APPROVED pode ser usada.

---

### 3.4. IntermediateIngredientUsage

Ligação entre tanque e matérias-primas.

**Campos:**
- intermediate_product_id
- raw_material_lot_id
- quantity_used
- unit
- prepared_by

**Regras:**
- Cada tanque deve ter rastreio de ingredientes.

---

## 4. Amostras

### 4.1. Sample (Amostra)

Registro de amostra retirada da linha ou do tanque.

**Campos:**
- collection_datetime
- collected_by
- sample_type
- batch_id (ao selecionar o batch_id/production_lot_id carrega automaticamente os dados do lote e os intermediate_product_id ativo neste lote
- intermediate_product_id 

**Regras:**
- Só lotes ACTIVE aparecem.
- Só tanques ACTIVE aparecem.

---

## 5. Parâmetros e Especificações

### 5.1. Parameter

Representa um parâmetro de qualidade.

**Campos:**
- name
- unit_of_measure
- can_be_used_in_multiple_products (true/false)

---

### 5.2. Specification

Representa limites ligados a um produto.

**Campos:**
- parameter_id
- product_id
- min_value
- target_value
- max_value

**Regras:**
- Um parâmetro pode ter várias especificações.
- Cada especificação é sempre específica por produto.

---

## 6. Pipeline de Análises

### 6.1. AnalysisPipelineItem

Item de análise gerado automaticamente.

**Regras:**
1. Ao registrar uma amostra:
 - O sistema identifica o produto do lote.
 - Carrega todas especificações ativas.
 - Gera automaticamente as análises pendentes.

---

## 7. User Stories

### 7.1. Registro de Lote

**Como** QA Manager  
**Quero** registrar um lote  
**Para** garantir rastreabilidade

---

### 7.2. Registro de Produto Intermédio

**Como** técnico  
**Quero** criar um tanque  
**Para** rastrear o processo

---

### 7.3. Registro de Ingredientes do Tanque

**Como** técnico  
**Quero** vincular matérias-primas  
**Para** garantir rastreabilidade

---

### 7.4. Registro de Amostra

**Como** técnico de laboratório  
**Quero** registrar a amostra  
**Para** gerar automaticamente os testes

---

### 7.5. Registro de Reagente

**Como** responsável do armazém  
**Quero** cadastrar reagente  
**Para** controlar stock

---

### 7.6. Entrada de Reagente

**Como** responsável do armazém  
**Quero** registrar entrada  
**Para** atualizar stock

---

### 7.7. Saída de Reagente

**Como** responsável  
**Quero** registrar saída  
**Para** controlar envio ao laboratório

---

## 8. Princípios de Qualidade (QA Level)

O SmartLab V4 deve:

- Garantir rastreabilidade ponta-a-ponta
- Garantir integridade dos dados
- Cumprir requisitos de auditoria
- Manter histórico imutável
## 9. Estrutura Personalizável por Fábrica

### 9.1. Princípio Base

Cada fábrica (plant) deve poder:

- Criar seus próprios tanques
- Criar suas próprias linhas de produção
- Definir seus próprios fluxos de produção
- Registrar seus próprios ciclos de limpeza (CIP)

**Regra global:**
> Nenhum objeto operacional (tanque, linha, CIP) é fixo no sistema. Tudo é configurável por fábrica.

---

## 10. Gestão de Tanques (Tanks)

### 10.1. Entidade: Tank

**Campos obrigatórios:**
- tank_code
- tank_name
- plant_id
- volume_capacity
- unit_of_measure
- status:
  - ACTIVE
  - MAINTENANCE
  - DECOMMISSIONED

### 10.2. Regras

- Cada fábrica pode ter dezenas ou centenas de tanques.
- Tanques desativados não aparecem em operações ativas.

---

## 11. Linhas de Produção

### 11.1. Entidade: ProductionLine

**Campos obrigatórios:**
- line_code
- line_name
- packaging type
- formats usados
- plant_id
- status:
  - ACTIVE
  - MAINTENANCE
  - STOPPED

---

### 11.2. Regras

- Cada planta define suas próprias linhas.
- Linhas inativas não aparecem para coleta.

---

## 12. Sistema de CIP (Cleaning In Place)

### 12.1. Objetivo

Rastrear limpeza de:

- Tanques
- Linhas
- Equipamentos críticos

Seguindo standards internacionais:

- EHEDG
- 3A Sanitary Standards
- ISO 22000
- FSSC 22000
- HACCP

---

### 12.2. Entidade: CIPRecord

**Campos obrigatórios:**
- object_type:
  - TANK
  - LINE
  - EQUIPMENT
- object_id
- cleaning_date
- cleaning_type:
  - ACID
  - CAUSTIC
  - HOT_WATER
  - SANITIZER
- operator_name
- verified_by (QA responsável)

---

### 12.3. Regras Críticas

- Um tanque NÃO pode ser marcado como utilizável se não tiver CIP válido.
- Uma linha NÃO pode operar se a limpeza estiver vencida.
- O sistema deve bloquear registros de produção se o CIP estiver expirado.

---

## 13. Integração CIP × Produção

### 13.1. Regra de Negócio Global

Antes de permitir:

✅ Criação de produto intermédio  
✅ Liberação de lote  
✅ Registro de amostra  

O sistema deve:

1. Verificar se o tanque possui CIP válido
2. Verificar se a linha possui CIP válido

Se não:

❌ Bloquear operação  
⚠️ Emitir alerta visual

---

## 14. Compliance Internacional

O módulo de CIP deve estar alinhado com:

- ISO 22000:2018
- FSSC 22000 v6
- Codex Alimentarius
- EHEDG Guidelines
- 3A Sanitary Standards

---

## 15. Resultado Estratégico

Com essa arquitetura:

✅ Cada fábrica é totalmente independente  
✅ Multi-tenant real  
✅ Compliance automático  
✅ Padrão Pepsi / Coca-Cola / Nestlé

---

**Status do Módulo:**  
✅ Pronto para desenvolvimento Enterprise  
