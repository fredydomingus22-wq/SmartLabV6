# SmartLab Enterprise — 03. Domain Model (Versão Enterprise)

## 📌 1. Introdução ao Domain Model

Este documento define o modelo de domínio oficial do SmartLab Enterprise. Ele representa todas as entidades, relações, atributos e regras centrais do sistema. É o coração lógico que sustenta o LIMS + QMS + FSMS + SPC + IA dentro de uma fábrica.

O modelo é projetado para:

* FSSC 22000
* ISO 22000
* HACCP (PRP, OPRP, PCC)
* ISO 9001 (NC + 8D)
* ISO 17025 (equipamentos, calibração)

Inclui suporte a multi-tenant, customização por fábrica e extensibilidade.

---

# 🧱 2. Entidades Principais

A plataforma contém **seis domínios centrais**:

1. **Produção & Lotes**
2. **Qualidade & Análises (LIMS)**
3. **Segurança Alimentar (FSMS)**
4. **Gestão da Qualidade (QMS)**
5. **Matéria-Prima & Fornecedores**
6. **Equipamentos & Reagentes**
7. **Configurações Avançadas (Specs, Parâmetros, Form Builder)**

Cada domínio é detalhado abaixo.

---

# 🏭 3. Produção & Lotes

Modelo hierárquico padrão das grandes indústrias (PepsiCo / Coca-Cola).

## 3.1 ProductionLot (Lote Pai)

| Campo           | Tipo     | Descrição                    |
| --------------- | -------- | ---------------------------- |
| id              | uuid     | Identificador único          |
| plant_id      | uuid     | Fábrica (Plant)             |
| code            | string   | Código do lote pai           |
| sku             | string   | Produto a ser produzido      |
| production_line | string   | Linha                        |
| shift           | string   | Turno                        |
| start_time      | datetime | Início                       |
| end_time        | datetime | Fim                          |
| status          | enum     | aberto / fechado / bloqueado |
| created_by      | uuid     | Criador                      |

### Relações

* **1 → N IntermediateLots**
* **1 → N Documents (registos da linha)**

---

## 3.2 IntermediateLot (Produto Intermédio — Xarope/Mistura)

| Campo             | Tipo                |
| ----------------- | ------------------- |
| id                | uuid                |
| production_lot_id | uuid (FK)           |
| code              | string              |
| tank              | string (ex: TK-501) |
| brix              | float               |
| ph                | float               |
| acidity           | float               |
| ingredients       | json                |
| prepared_at       | datetime            |
| status            | enum                |

### Relações

* **1 → N FinishedProductLot**
* **1 → N LabAnalysis**

---

## 3.3 FinishedProductLot (Produto Acabado)

| Campo               | Tipo                                     |
| ------------------- | ---------------------------------------- |
| id                  | uuid                                     |
| intermediate_lot_id | uuid (FK)                                |
| code                | string                                   |
| line                | string                                   |
| co2                 | float                                    |
| brix                | float                                    |
| ph                  | float                                    |
| density             | float                                    |
| status              | enum (liberado / bloqueado / em análise) |
| analyzed_at         | datetime                                 |

### Relações

* **1 → N LabAnalysis**
* **1 → N Deviations**

---

# 🔬 4. LIMS — Qualidade & Análises

Modelo de laboratório industrial com suporte a parâmetros dinâmicos.

## 4.1 Sample (Amostra)

| Campo            | Tipo                                            |
| ---------------- | ----------------------------------------------- |
| id               | uuid                                            |
| sample_type      | enum (raw_material, water, intermediate, final) |
| product_code     | string                                          |
| lot_id           | uuid (FK)                                       |
| collection_point | string                                          |
| collected_at     | datetime                                        |
| collected_by     | uuid                                            |
| status           | enum                                            |

---

## 4.2 LabAnalysis

| Campo             | Tipo                                 |
| ----------------- | ------------------------------------ |
| id                | uuid                                 |
| sample_id         | uuid (FK)                            |
| parameter_id      | uuid (FK)                            |
| result_value      | float/text                           |
| unit              | string                               |
| limit_min         | float                                |
| limit_max         | float                                |
| analyst_id        | uuid                                 |
| analysis_date     | datetime                             |
| validation_status | enum (approved / failed / deviation) |
| reviewer_id       | uuid                                 |

---

## 4.3 Parameters (Parâmetros)

| Campo       | Tipo                                   |
| ----------- | -------------------------------------- |
| id          | uuid                                   |
| name        | string                                 |
| type        | enum (numeric, text, bool, list, file) |
| unit        | string                                 |
| method      | string                                 |
| spec_min    | float                                  |
| spec_target | float                                  |
| spec_max    | float                                  |
| frequency   | string                                 |
| criticality | enum (critical / major / minor)        |

---

# 🛡 5. FSMS — Food Safety

## 5.1 PRP

| Campo     | Tipo   |
| --------- | ------ |
| id        | uuid   |
| name      | string |
| frequency | string |
| status    | enum   |

---

## 5.2 OPRP

| Campo     | Tipo   |
| --------- | ------ |
| id        | uuid   |
| name      | string |
| frequency | string |
| limit     | float  |
| status    | string |

---

## 5.3 PCC

| Campo          | Tipo   |
| -------------- | ------ |
| id             | uuid   |
| name           | string |
| critical_limit | string |
| status         | enum   |

---

# 🧾 6. QMS — Gestão da Qualidade

## 6.1 NonConformity (NC)

| Campo             | Tipo                        |
| ----------------- | --------------------------- |
| id                | uuid                        |
| sample_id         | uuid (FK)                   |
| parameter_id      | uuid                        |
| severity          | enum (critical/major/minor) |
| deviation_type    | text                        |
| created_at        | datetime                    |
| root_cause        | text                        |
| corrective_action | text                        |
| closed_by         | uuid                        |
| closed_at         | datetime                    |

---

## 6.2 EightD Report

| Campo          | Tipo |
| -------------- | ---- |
| nc_id          | uuid |
| d1_team        | json |
| d2_problem     | text |
| d3_containment | text |
| d4_rootcause   | text |
| d5_corrective  | text |
| d6_implement   | text |
| d7_prevent     | text |
| d8_validation  | text |

---

# 📦 7. Matéria-Prima & Fornecedores

## 7.1 RawMaterial

| Campo          | Tipo   |
| -------------- | ------ |
| id             | uuid   |
| name           | string |
| specifications | json   |

---

## 7.2 RawMaterialLot

| Campo           | Tipo     |
| --------------- | -------- |
| id              | uuid     |
| raw_material_id | uuid     |
| lot             | string   |
| supplier_id     | uuid     |
| received_at     | datetime |
| status          | enum     |
| coa_file        | text (URL)     |

---

## 7.3 Supplier

| Campo       | Tipo   |
| ----------- | ------ |
| id          | uuid   |
| name        | string |
| risk_level  | enum   |
| audit_score | float  |

---

# ⚗️ 8. Equipamentos & Reagentes

## 8.1 Equipment

| Campo           | Tipo     |
| --------------- | -------- |
| id              | uuid     |
| name            | string   |
| last_calibrated | datetime |
| calibration_due | datetime |
| status          | enum     |

---

## 8.2 Reagent

| Campo       | Tipo     |
| ----------- | -------- |
| id          | uuid     |
| name        | string   |
| stock       | float    |
| unit        | string   |
| expiry_date | datetime |
| last_used   | datetime |

---

# ⚙️ 9. Configurações Avançadas

Módulos de flexibilidade total:

## 9.1 Form Builder

* Campos dinâmicos
* Grupos repetíveis
* Condicionais
* Regras de validação
* Associação a parâmetros

## 9.2 Specification Engine

* Por produto
* Por linha
* Por turno
* Por lote
* Por embalagem

## 9.3 Sampling Plan

* Frequência por SKU
* Exceções
* Métodos de coleta

---

# 🔗 10. Relacionamentos Resumidos

```
ProductionLot 1---N IntermediateLots
IntermediateLot 1---N FinishedProductLots
FinishedProductLot 1---N LabAnalysis
Sample 1---N LabAnalysis
Parameters 1---N LabAnalysis
RawMaterial 1---N RawMaterialLot
Supplier 1---N RawMaterialLot
NC 1---1 8D Report
Equipment 1---N Calibration Records
```

---

# 📘 11. Observações

Este Domain Model serve como:

* Base do banco de dados
* Guia para APIs do Supabase
* Fonte oficial para codificação no Next.js
* Referência de auditoria (ISO/FSSC)

---

**Documento concluído.**

Se quiseres avançar para o próximo:
👉 “Avança com o 04 – URS Enterprise”
