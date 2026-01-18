# SmartLab – Núcleo físico MES/LIMS/QMS/FSMS (Supabase)

# SmartLab – Núcleo físico MES/LIMS/QMS/FSMS (Supabase)

> Este documento consolida o núcleo físico em Supabase/PostgreSQL para MES, LIMS, QMS e FSMS. É a base para gerar DDL, tipos TypeScript e contratos entre backend (NestJS) e frontend (React/TS).
* * *

## Proposta de esquema físico núcleo MES/LIMS/QMS/FSMS (Supabase)

Baseado em:
*   *   *   

Esta proposta define o **núcleo físico** em Supabase/PostgreSQL para MES, LIMS, QMS e FSMS, com foco em:
*   chaves fortes de integração (especialmente `lote_producao_id`),
*   colunas de estado explícitas (execução, qualidade, higiene, metrologia, NC/CAPA),
*   multitenancy (`tenant_id`),
*   auditabilidade (campos padrão + `audit_log`).

> **Invariantes globais**Nenhum `lote_producao` pode estar simultaneamente `LIBERADO` e `BLOQUEADO/SEGREGADO`.Nenhum lote é `LIBERADO` sem avaliação do **motor de decisão de qualidade** (BL‑01…BL‑04 em ).Tabelas críticas são sempre multi‑tenant e auditáveis.
* * *

## 1\. Convenções gerais de BD

*   **Nomeação**: `snake_case`, sufixo `_id` para PK/FK.
*   **PK padrão**: `uuid` gerado pelo Supabase (`uuid_generate_v4()` ou equivalente).
*   **Campos padrão** em todas as entidades críticas:
    *   `tenant_id uuid not null` (FK para `tenant.id`).
    *   `created_at timestamptz not null default now()`
    *   `created_by uuid not null` (FK `usuario.id`)
    *   `updated_at timestamptz not null default now()`
    *   `updated_by uuid not null` (FK `usuario.id`)
    *   opcional: `deleted_at timestamptz null` para soft‑delete controlado (onde fizer sentido).
*   **RLS**: todas as políticas baseadas em `tenant_id` + papel do utilizador (Qualidade, FS, Produção, Laboratório, Auditor).
* * *

## 2\. Tabelas transversais (empresa, produto, utilizadores)

### 2.1 `tenant`

```sql
tenant (
  id uuid pk,
  name text not null,
  ...,
  created_at timestamptz,
  ...
)
```

### 2.2 `empresa`, `unidade_industrial`, `linha_producao`

```sql
empresa (
  id uuid pk,
  tenant_id uuid fk tenant,
  nome text not null,
  ... audit ...
)

unidade_industrial (
  id uuid pk,
  tenant_id uuid fk tenant,
  empresa_id uuid fk empresa,
  nome text not null,
  ... audit ...
)

linha_producao (
  id uuid pk,
  tenant_id uuid fk tenant,
  unidade_industrial_id uuid fk unidade_industrial,
  nome text not null,
  codigo text unique,
  ... audit ...
)
```

Índices:
*   `idx_linha_prod_tenant_unidade` em `(tenant_id, unidade_industrial_id)`.

### 2.3 Produto / engenharia de produto (núcleo mínimo aqui)

```sql
produto (
  id uuid pk,
  tenant_id uuid,
  codigo text unique,
  nome text,
  familia text,
  ... audit ...
)

versao_produto (
  id uuid pk,
  tenant_id uuid,
  produto_id uuid fk produto,
  versao text,
  vigente_desde date,
  vigente_ate date null,
  ... audit ...
)

especificacao_produto (
  id uuid pk,
  tenant_id uuid,
  versao_produto_id uuid fk versao_produto,
  nome text,
  vigente_desde date,
  vigente_ate date null,
  ... audit ...
)

parametro_controle (
  id uuid pk,
  tenant_id uuid,
  especificacao_produto_id uuid fk especificacao_produto,
  nome text,
  unidade text,
  limite_min numeric,
  limite_max numeric,
  criticidade text check in ('menor','maior','critica'),
  origem text check in ('processo','laboratorio','pcc'),
  ... audit ...
)
```

### 2.4 Utilizadores, perfis e `audit_log`

```sql
usuario (
  id uuid pk,
  tenant_id uuid,
  nome text,
  email text,
  ...
)

perfil_acesso (
  id uuid pk,
  tenant_id uuid,
  nome text check in ('OPERADOR','SUPERVISOR','QUALIDADE','FSMS','LABORATORIO','AUDITOR','ADMIN'),
  ...
)

usuario_perfil (
  usuario_id uuid fk usuario,
  perfil_id uuid fk perfil_acesso,
  primary key (usuario_id, perfil_id)
)

audit_log (
  id uuid pk,
  tenant_id uuid,
  entity_name text,
  entity_id uuid,
  acao text,
  dados_antes jsonb,
  dados_depois jsonb,
  realizado_por uuid fk usuario,
  realizado_em timestamptz default now()
)
```

> **Risco**: sem `audit_log` centralizado, não se consegue provar em auditoria “quem liberou/bloqueou o quê e quando”.
* * *

## 3\. Núcleo MES (ordens, lotes, eventos, consumo)

### 3.1 `ordem_producao`

```sql
ordem_producao (
  id uuid pk,
  tenant_id uuid,
  produto_id uuid fk produto,
  linha_producao_id uuid fk linha_producao,
  quantidade_planeada numeric,
  data_planeada_inicio timestamptz,
  data_planeada_fim timestamptz,
  status_execucao text check in ('PLANEADA','EM_EXECUCAO','CONCLUIDA','CANCELADA'),
  ... audit ...
)
```

### 3.2 `lote_producao`

```sql
lote_producao (
  id uuid pk,
  tenant_id uuid,
  ordem_producao_id uuid fk ordem_producao,
  produto_id uuid fk produto,
  linha_producao_id uuid fk linha_producao,
  turno_id uuid fk turno,
  codigo_lote text unique,
  quantidade_real numeric,
  data_inicio timestamptz,
  data_fim timestamptz,
  status_execucao text check in ('EM_EXECUCAO','CONCLUIDA'),
  status_qualidade text check in (
    'AGUARDANDO_ANALISES',
    'AGUARDANDO_LIBERACAO_QUALIDADE',
    'LIBERADO',
    'BLOQUEADO',
    'SEGREGADO',
    'DESCARTADO'
  ),
  motivo_bloqueio text,
  ... audit ...
)
```

Índices:
*   `idx_lote_prod_tenant_statusq` em `(tenant_id, status_qualidade)`.
*   `idx_lote_prod_codigo` em `codigo_lote`.

### 3.3 Consumos e equipamentos

```sql
lote_materia_prima (
  id uuid pk,
  tenant_id uuid,
  fornecedor_id uuid,
  materia_prima_id uuid,
  codigo_lote_fornecedor text,
  validade date,
  status_qualidade text check in ('AGUARDANDO_INSPECAO','EM_ANALISE','LIBERADO','BLOQUEADO','CONSUMIDO'),
  ... audit ...
)

lote_producao_materia_prima (
  lote_producao_id uuid fk lote_producao,
  lote_materia_prima_id uuid fk lote_materia_prima,
  quantidade numeric,
  primary key (lote_producao_id, lote_materia_prima_id)
)

lote_producao_equipamento (
  lote_producao_id uuid fk lote_producao,
  equipamento_processo_id uuid fk equipamento_processo,
  primary key (lote_producao_id, equipamento_processo_id)
)

evento_producao (
  id uuid pk,
  tenant_id uuid,
  lote_producao_id uuid fk lote_producao,
  equipamento_processo_id uuid fk equipamento_processo null,
  tipo text check in ('INICIO','FIM','PARAGEM','RETOMA','SUCATA','REPROCESSO'),
  motivo text,
  ocorrido_em timestamptz,
  ... audit ...
)
```

> **Invariante**: `lote_materia_prima.status_qualidade = 'BLOQUEADO'` **não pode** ser ligado em novos registos de `lote_producao_materia_prima`.
* * *

## 4\. Núcleo LIMS (plano de amostragem, amostra, ensaio, resultado, laudo)

### 4.1 `plano_amostragem`

```sql
plano_amostragem (
  id uuid pk,
  tenant_id uuid,
  produto_id uuid fk produto,
  linha_producao_id uuid fk linha_producao,
  tipo_amostra text,
  frequencia text,
  tamanho_amostra integer,
  ativo boolean,
  ... audit ...
)
```

### 4.2 `amostra`

```sql
amostra (
  id uuid pk,
  tenant_id uuid,
  plano_amostragem_id uuid fk plano_amostragem,
  lote_producao_id uuid fk lote_producao null,
  lote_materia_prima_id uuid fk lote_materia_prima null,
  origem text check in ('PROCESSO','PRODUTO_ACABADO','MATERIA_PRIMA','AMBIENTE','AGUA','SUPERFICIE'),
  estado text check in ('AGUARDANDO_COLETA','EM_ANALISE','CONCLUIDA','CANCELADA'),
  data_alvo_coleta timestamptz,
  ... audit ...
)
```

### 4.3 `ensaio_laboratorial`, `resultado_ensaio`, `laudo_lote`

```sql
ensaio_laboratorial (
  id uuid pk,
  tenant_id uuid,
  amostra_id uuid fk amostra,
  tipo text,
  metodo text,
  norma text,
  ... audit ...
)

resultado_ensaio (
  id uuid pk,
  tenant_id uuid,
  ensaio_laboratorial_id uuid fk ensaio_laboratorial,
  parametro_controle_id uuid fk parametro_controle,
  valor numeric,
  unidade text,
  conformidade text check in ('APROVADO','REPROVADO'),
  criticidade text check in ('menor','maior','critica'),
  estado text check in ('PROVISORIO','VALIDADO_LABORATORIO','VALIDADO_QUALIDADE'),
  ... audit ...
)

laudo_lote (
  id uuid pk,
  tenant_id uuid,
  lote_producao_id uuid fk lote_producao,
  emitido_por uuid fk usuario,
  estado text check in ('RASCUNHO','EMITIDO','ANULADO'),
  emitido_em timestamptz,
  ... audit ...
)
```

> **Invariantes LIMS**Não emitir `laudo_lote` enquanto existirem `resultado_ensaio` obrigatórios não `VALIDADO_QUALIDADE`.Sempre que `conformidade = 'REPROVADO'` e `criticidade in ('maior','critica')`, deve existir uma `nao_conformidade` ligada.
* * *

## 5\. Núcleo FSMS (HACCP, PCC, monitorização)

### 5.1 `plano_haccp`, `pcc`, `monitorizacao_pcc`

```sql
plano_haccp (
  id uuid pk,
  tenant_id uuid,
  unidade_industrial_id uuid fk unidade_industrial,
  produto_id uuid fk produto,
  linha_producao_id uuid fk linha_producao,
  versao text,
  vigente_desde date,
  vigente_ate date null,
  ... audit ...
)

pcc (
  id uuid pk,
  tenant_id uuid,
  plano_haccp_id uuid fk plano_haccp,
  nome text,
  parametro_controle_id uuid fk parametro_controle,
  limite_critico_min numeric,
  limite_critico_max numeric,
  estado text check in ('ATIVO','SUSPENSO','OBSOLETO'),
  ... audit ...
)

monitorizacao_pcc (
  id uuid pk,
  tenant_id uuid,
  pcc_id uuid fk pcc,
  lote_producao_id uuid fk lote_producao null,
  linha_producao_id uuid fk linha_producao,
  valor numeric,
  dentro_limite_critico boolean,
  ocorreu_em timestamptz,
  ... audit ...
)
```

> **Regra chave**: registos de `monitorizacao_pcc` fora de limite crítico **devem** originar `nao_conformidade` e podem bloquear o `lote_producao` (BL‑02).
* * *

## 6\. Núcleo QMS (NC, CAPA, auditorias)

```sql
nao_conformidade (
  id uuid pk,
  tenant_id uuid,
  origem text check in ('LIMS','PCC','CIP','FORNECEDOR','AUDITORIA','METROLOGIA','BPF'),
  criticidade text check in ('MENOR','MAIOR','CRITICA'),
  estado text check in ('ABERTA','EM_INVESTIGACAO','EM_TRATAMENTO','ENCERRADA'),
  lote_producao_id uuid fk lote_producao null,
  lote_materia_prima_id uuid fk lote_materia_prima null,
  resultado_ensaio_id uuid fk resultado_ensaio null,
  monitorizacao_pcc_id uuid fk monitorizacao_pcc null,
  execucao_cip_id uuid fk execucao_cip null,
  ... audit ...
)

capa (
  id uuid pk,
  tenant_id uuid,
  nao_conformidade_id uuid fk nao_conformidade,
  descricao text,
  responsavel_id uuid fk usuario,
  prazo date,
  estado text check in ('PLANEADA','EM_EXECUCAO','EM_VERIFICACAO_EFICACIA','ENCERRADA'),
  eficacia text check in ('PENDENTE','SATISFATORIA','NAO_SATISFATORIA'),
  ... audit ...
)

auditoria (
  id uuid pk,
  tenant_id uuid,
  tipo text check in ('INTERNA','EXTERNA','FORNECEDOR','CERTIFICADORA'),
  periodo_inicio date,
  periodo_fim date,
  ... audit ...
)

auditoria_nao_conformidade (
  auditoria_id uuid fk auditoria,
  nao_conformidade_id uuid fk nao_conformidade,
  primary key (auditoria_id, nao_conformidade_id)
)
```

> **Invariante QMS**: `nao_conformidade` só pode ser `ENCERRADA` quando todas as `capa` associadas estiverem `ENCERRADA` com `eficacia = 'SATISFATORIA'`.
* * *

## 7\. Integração núcleo + motor de decisão de qualidade

O motor de decisão (BL‑01…BL‑04) é implementado via queries sobre estas tabelas:
*   Entrada principal: `lote_producao` + joins para `resultado_ensaio`, `monitorizacao_pcc`, `nao_conformidade`, `execucao_cip`, `equipamento_processo`, `equipamento_laboratorio`.
*   Saída: atualização transacional de `lote_producao.status_qualidade` + registo em `audit_log`.

### Tipo conceitual em TypeScript

```plain
type LoteQualidadeEstado =
  | 'AGUARDANDO_ANALISES'
  | 'AGUARDANDO_LIBERACAO_QUALIDADE'
  | 'LIBERADO'
  | 'BLOQUEADO'
  | 'SEGREGADO'
  | 'DESCARTADO';

interface MotorDecisaoQualidadeInput {
  loteProducaoId: string; // uuid
}

interface MotorDecisaoQualidadeOutput {
  novoEstado: LoteQualidadeEstado;
  regrasDisparadas: string[]; // ex.: ['BL-01', 'BL-03']
}
```

* * *

## 8\. Como o programador deve usar este documento

*   Tomar estas definições como **fonte única de verdade** para o núcleo de BD (Supabase).
*   Gerar DDL (`CREATE TABLE`) diretamente a partir destas estruturas.
*   Derivar tipos TypeScript e schemas Zod/class-validator com os mesmos nomes de campos e domínios de estado.
*   Implementar o serviço de decisão de qualidade garantindo **exaustividade** sobre `LoteQualidadeEstado` (sem `any`).