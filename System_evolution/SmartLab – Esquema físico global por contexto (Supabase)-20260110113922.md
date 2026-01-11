# SmartLab – Esquema físico global por contexto (Supabase)

# SmartLab – Esquema físico global por contexto (Supabase)

> Este documento organiza o modelo físico do SmartLab por contexto de domínio (MES, LIMS+Metrologia, QMS/FSMS, Materiais & Fornecedores, Engenharia de Produto, Segurança & Acesso), fechando colunas/PK/FK mínimos e reforçando multitenancy e auditabilidade.
* * *

## Esquema físico global (Supabase) a partir do ERD Funcional v1

Esta visão assume o núcleo já definido na página **SmartLab – Núcleo físico MES/LIMS/QMS/FSMS (Supabase)** e nos documentos de referência:

*   *   *   

Aqui:
*   **fechamos o modelo físico por contexto**;
*   reforçamos chaves de integração e multitenancy;
*   listamos colunas/PK/FK mínimos por contexto;
*   garantimos suporte direto ao motor de decisão BL‑01…BL‑04.

> **Invariantes globais reutilizados do núcleo**`tenant_id` presente em todas as tabelas de domínio.Tabelas críticas com `created_at/created_by/updated_at/updated_by`.Chaves fortes de integração: `lote_producao_id`, `lote_materia_prima_id`, `equipamento_processo_id`, `equipamento_laboratorio_id`, `plano_haccp_id`, `pcc_id`, `plano_amostragem_id`.
* * *

## 1\. Contexto Produção/MES (resumo físico)

Tabelas principais já definidas no núcleo:
*   `ordem_producao`
*   `lote_producao`
*   `evento_producao`
*   `lote_materia_prima`
*   `lote_producao_materia_prima`
*   `lote_producao_equipamento`

**Índices adicionais MES:**
*   `idx_evento_prod_lote_data` em `(lote_producao_id, ocorrido_em)`.
*   `idx_lote_mp_status` em `(tenant_id, status_qualidade)`.

> **Risco**: se `lote_producao` não for tratado como eixo único de rastreio, relatórios de rastreabilidade tornam‑se caros e frágeis.
* * *

## 2\. Contexto LIMS + Metrologia (ISO 17025)

### 2.1 LIMS operacional (reuso do núcleo + extensões)

Reusa:
*   `plano_amostragem`, `amostra`, `ensaio_laboratorial`, `resultado_ensaio`, `laudo_lote`.

Extensões típicas:

```sql
tipo_amostra_lims (
  id uuid pk,
  tenant_id uuid,
  codigo text unique,
  descricao text,
  ... audit ...
)

amostra (
  ...,
  tipo_amostra_id uuid fk tipo_amostra_lims,
  analista_id uuid fk usuario,
  local_coleta text,
  observacoes text
)

resultado_ensaio (
  ...,
  limite_especificacao_min numeric,
  limite_especificacao_max numeric,
  origem_limite text check in ('ESPECIFICACAO_PRODUTO','PLANO_AMOSTRAGEM','MANUAL'),
  comentario_validacao text
)
```

### 2.2 Metrologia (ligação com página específica de metrologia)

Ver detalhes estruturais na página **SmartLab – Metrologia & equipamentos de laboratório (ISO 17025)**; aqui apenas relembramos as entidades principais:

```sql
equipamento_laboratorio (
  id uuid pk,
  tenant_id uuid,
  codigo text unique,
  descricao text,
  fabricante text,
  modelo text,
  numero_serie text,
  localizacao text,
  faixa_medicao text,
  incerteza_tipica text,
  estado_metrologico text check in ('APTO','EM_CALIBRACAO','REPROVADO','FORA_DE_SERVICO'),
  proxima_calibracao_prevista date,
  ... audit ...
)

certificado_calibracao (
  id uuid pk,
  tenant_id uuid,
  equipamento_laboratorio_id uuid fk equipamento_laboratorio,
  numero_certificado text,
  emissor text,
  data_calibracao date,
  data_validade date,
  resultado text check in ('APTO','REPROVADO'),
  arquivo_url text,
  ... audit ...
)

intervencao_manutencao (
  id uuid pk,
  tenant_id uuid,
  equipamento_laboratorio_id uuid fk equipamento_laboratorio,
  tipo text check in ('CORRETIVA','PREVENTIVA'),
  descricao text,
  impacta_calibracao boolean,
  realizada_em timestamptz,
  ... audit ...
)
```

**RLS crítica:**
*   LIMS deve impedir uso de `equipamento_laboratorio` com `estado_metrologico != 'APTO'` em novos `ensaio_laboratorial`.
* * *

## 3\. Contexto QMS/FSMS (NC, CAPA, HACCP, BPF)

Reuso das tabelas do núcleo:
*   `plano_haccp`, `pcc`, `monitorizacao_pcc`, `nao_conformidade`, `capa`, `auditoria`, `checklist_bpf`, `execucao_checklist`.

Exemplo de modelagem de checklist BPF:

```sql
checklist_bpf (
  id uuid pk,
  tenant_id uuid,
  unidade_industrial_id uuid fk unidade_industrial,
  area text,
  titulo text,
  frequencia text,
  ativo boolean,
  ... audit ...
)

execucao_checklist (
  id uuid pk,
  tenant_id uuid,
  checklist_bpf_id uuid fk checklist_bpf,
  realizado_por uuid fk usuario,
  realizado_em timestamptz,
  resultado_global text check in ('CONFORME','NAO_CONFORME','PARCIAL'),
  ... audit ...
)

execucao_checklist_item (
  id uuid pk,
  tenant_id uuid,
  execucao_checklist_id uuid fk execucao_checklist,
  pergunta text,
  resposta text check in ('SIM','NAO','NAO_APLICA'),
  comentario text
)
```

Integrações típicas QMS/FSMS:
*   `execucao_checklist_item` com `resposta = 'NAO'` pode gerar `nao_conformidade` origem `BPF`.
*   `monitorizacao_pcc` fora de limite crítico gera NC origem `PCC`.
* * *

## 4\. Contexto Materiais & Fornecedores

```sql
fornecedor (
  id uuid pk,
  tenant_id uuid,
  nome text,
  nif text,
  categoria text,
  ... audit ...
)

materia_prima (
  id uuid pk,
  tenant_id uuid,
  codigo text,
  descricao text,
  tipo text check in ('MP','EMBALAGEM','INSUMO'),
  ... audit ...
)

lote_materia_prima (
  id uuid pk,
  tenant_id uuid,
  fornecedor_id uuid fk fornecedor,
  materia_prima_id uuid fk materia_prima,
  codigo_lote_fornecedor text,
  validade date,
  status_qualidade text check in ('AGUARDANDO_INSPECAO','EM_ANALISE','LIBERADO','BLOQUEADO','CONSUMIDO'),
  ... audit ...
)

inspecao_recepcao (
  id uuid pk,
  tenant_id uuid,
  lote_materia_prima_id uuid fk lote_materia_prima,
  data_recepcao timestamptz,
  resultado text check in ('APROVADO','REPROVADO'),
  observacoes text,
  ... audit ...
)

avaliacao_fornecedor (
  id uuid pk,
  tenant_id uuid,
  fornecedor_id uuid fk fornecedor,
  periodo_inicio date,
  periodo_fim date,
  score numeric,
  classe text check in ('A','B','C'),
  ... audit ...
)
```

> **Invariante**: `lote_materia_prima.status_qualidade = 'BLOQUEADO'` impede:ligação a novos `lote_producao_materia_prima`;transição de `lote_producao.status_qualidade` para `LIBERADO` enquanto houver NC crítica ligada a esse lote de MP.
* * *

## 5\. Contexto Engenharia de Produto

Reuso de:
*   `produto`, `versao_produto`, `especificacao_produto`, `parametro_controle`.

Extensões mínimas:

```sql
receita (
  id uuid pk,
  tenant_id uuid,
  versao_produto_id uuid fk versao_produto,
  nome text,
  vigente_desde date,
  vigente_ate date null,
  ... audit ...
)

receita_item (
  id uuid pk,
  tenant_id uuid,
  receita_id uuid fk receita,
  materia_prima_id uuid fk materia_prima,
  proporcao numeric,
  unidade text,
  ... audit ...
)
```

Integração:
*   Atualizações de `parametro_controle` propagam limites para `pcc` e critérios de `resultado_ensaio` (via serviços de aplicação, não via trigger cega).
* * *

## 6\. Contexto Segurança & Acesso

Modelagem mínima (alinhada a Supabase Auth):
*   `usuario`, `perfil_acesso`, `usuario_perfil`, `audit_log`.

RLS de alto nível:
*   **Produção**: lê/escreve `lote_producao`, `evento_producao` dentro do `tenant_id`, mas não pode alterar `status_qualidade`.
*   **Qualidade/FSMS**: pode alterar `status_qualidade`, criar NC/CAPA, gerir planos HACCP.
*   **LIMS**: cria/atualiza `amostra`, `ensaio_laboratorial`, `resultado_ensaio` até `VALIDADO_LABORATORIO`.
*   **Auditor**: leitura ampla, sem capacidade de alteração.
* * *

## 7\. Suporte explícito ao motor BL‑01…BL‑04

Com este esquema por contexto:

*   **BL‑01** (resultado crítico fora de especificação): join `lote_producao` → `amostra` → `ensaio_laboratorial` → `resultado_ensaio` com `conformidade = 'REPROVADO'` e `criticidade in ('maior','critica')`.
*   **BL‑02** (PCC fora de limite crítico): join `lote_producao` → `monitorizacao_pcc` com `dentro_limite_critico = false`.
*   **BL‑03** (ausência de análises obrigatórias): verificação de `parametro_controle` obrigatórios vs `resultado_ensaio` existentes e estados.
*   **BL‑04** (liberação normal): combina BL‑01..BL‑03 + estados de `lote_materia_prima`, `equipamento_processo` e `equipamento_laboratorio`.
* * *

## 8\. Como o programador deve usar este documento

*   Utilizar por contexto para gerar DDL e para organizar módulos de repositório (`@smartlab/db-schema` por domínio).
*   Quando estiver a implementar serviços, manter a mesma separação de contexto em módulos NestJS.
*   Reutilizar as mesmas chaves (`*_id`) e estados descritos aqui em DTOs e tipos TS (sem `any`).