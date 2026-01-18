# SmartLab – Equipamentos de processo, CIPs & estados de higiene

# SmartLab – Equipamentos de processo, CIPs & estados de higiene

> Este documento modela **equipamentos de processo, CIPs e estados de higiene**, integrando MES, FSMS (HACCP), LIMS e QMS, com foco em bloqueio/liberação de equipamentos e rastreabilidade de CIP.
* * *

## 1\. Entidades principais

### 1.1 `equipamento_processo`

```sql
equipamento_processo (
  id uuid pk,
  tenant_id uuid,
  unidade_industrial_id uuid fk unidade_industrial,
  codigo text unique,
  descricao text,
  tipo text, -- tanque, linha, enchedora, pasteurizador, etc.
  linha_producao_id uuid fk linha_producao null,
  estado_higiene text check in (
    'LIBERADO_USO',
    'REQUER_CIP',
    'EM_CIP',
    'BLOQUEADO_POR_CIP_REPROVADO'
  ),
  data_ultimo_cip_conforme timestamptz null,
  programa_padrao_cip text null,
  ... audit ...
)
```

### 1.2 `circuito_cip` e `circuito_cip_equipamento`

```sql
circuito_cip (
  id uuid pk,
  tenant_id uuid,
  unidade_industrial_id uuid fk unidade_industrial,
  nome text,
  descricao text,
  ... audit ...
)

circuito_cip_equipamento (
  circuito_cip_id uuid fk circuito_cip,
  equipamento_processo_id uuid fk equipamento_processo,
  primary key (circuito_cip_id, equipamento_processo_id)
)
```

### 1.3 `ponto_higiene`

```sql
ponto_higiene (
  id uuid pk,
  tenant_id uuid,
  circuito_cip_id uuid fk circuito_cip,
  equipamento_processo_id uuid fk equipamento_processo,
  descricao text,
  eh_ponto_amostragem boolean default false,
  pcc_id uuid fk pcc null,
  ... audit ...
)
```

### 1.4 `execucao_cip` e `execucao_cip_equipamento`

```sql
execucao_cip (
  id uuid pk,
  tenant_id uuid,
  circuito_cip_id uuid fk circuito_cip,
  iniciado_por uuid fk usuario,
  iniciado_em timestamptz,
  finalizado_em timestamptz null,
  programa text,
  estado text check in (
    'PLANEADO',
    'EM_EXECUCAO',
    'CONCLUIDO_CONFORME',
    'CONCLUIDO_COM_ALERTA',
    'ABORTADO'
  ),
  resultado_global text check in ('CONFORME','NAO_CONFORME','EM_AVALIACAO'),
  motivo_nao_conformidade text,
  ... audit ...
)

execucao_cip_equipamento (
  execucao_cip_id uuid fk execucao_cip,
  equipamento_processo_id uuid fk equipamento_processo,
  primary key (execucao_cip_id, equipamento_processo_id)
)
```

### 1.5 `parametro_cip_medido`

```sql
parametro_cip_medido (
  id uuid pk,
  tenant_id uuid,
  execucao_cip_id uuid fk execucao_cip,
  ponto_higiene_id uuid fk ponto_higiene null,
  nome text,              -- temp_caustico, condutividade, etc.
  valor numeric,
  unidade text,
  limite_min_esperado numeric null,
  limite_max_esperado numeric null,
  dentro_limite boolean,
  medido_em timestamptz,
  ... audit ...
)
```

> **Invariantes de higiene/CIP**Equipamento com `estado_higiene IN ('REQUER_CIP','BLOQUEADO_POR_CIP_REPROVADO')` **não pode** ser ligado a novos `lote_producao`.Execuções de CIP reprovadas bloqueiam os equipamentos envolvidos até nova execução conforme.
* * *

## 2\. Integração com HACCP/FSMS e MES

### 2.1 Relação com PCC / Plano HACCP

Alguns `ponto_higiene` podem estar mapeados a `pcc` específicos via `pcc_id`, permitindo usar parâmetros de CIP como evidência de controlo de PCC.

### 2.2 Relação com `lote_producao`

`lote_producao` liga‑se a `equipamento_processo` via `lote_producao_equipamento` (definido no núcleo):

```sql
lote_producao_equipamento (
  lote_producao_id uuid fk lote_producao,
  equipamento_processo_id uuid fk equipamento_processo,
  primary key (lote_producao_id, equipamento_processo_id)
)
```

> **Regra de negócio**: ao associar `equipamento_processo` a um novo `lote_producao`, backend verifica:`estado_higiene = 'LIBERADO_USO'`;`data_ultimo_cip_conforme` dentro da janela máxima definida em configuração FSMS.

### 2.3 Integração com LIMS (amostras de água/superfície)

```sql
amostra (
  ...,
  execucao_cip_id uuid fk execucao_cip null,
  equipamento_processo_id uuid fk equipamento_processo null,
  origem text check in (..., 'AGUA_CIP','SUPERFICIE_CIP')
)
```

Isto liga `resultado_ensaio` microbiológico diretamente a uma execução de CIP específica.
* * *

## 3\. Integração com QMS (NC/CAPA)

`nao_conformidade` suporta origem "CIP" e FK para `execucao_cip`:

```sql
nao_conformidade (
  ...,
  origem text check in (..., 'CIP', ...),
  execucao_cip_id uuid fk execucao_cip null,
  ...
)
```

Regras de negócio propostas:

1. **Execução de CIP reprovada**
    *   Se `execucao_cip.resultado_global = 'NAO_CONFORME'` ou existir `parametro_cip_medido.dentro_limite = false` em parâmetro crítico:
        *   criar `nao_conformidade` com `origem = 'CIP'`;
        *   para cada `equipamento_processo` em `execucao_cip_equipamento`:
            *   atualizar `estado_higiene` para `BLOQUEADO_POR_CIP_REPROVADO`.
2. **Nova execução de CIP conforme**
    *   Quando nova `execucao_cip` nesse circuito fica `CONCLUIDO_CONFORME` e parâmetros críticos estão dentro de limite:
        *   backend pode mudar `estado_higiene` relevante para `LIBERADO_USO` **desde que** a NC associada esteja tratada (regra configurável).
* * *

## 4\. Estados e tipos (TypeScript conceitual)

```plain
type EstadoHigieneEquipamento =
  | 'LIBERADO_USO'
  | 'REQUER_CIP'
  | 'EM_CIP'
  | 'BLOQUEADO_POR_CIP_REPROVADO';

type EstadoExecucaoCip =
  | 'PLANEADO'
  | 'EM_EXECUCAO'
  | 'CONCLUIDO_CONFORME'
  | 'CONCLUIDO_COM_ALERTA'
  | 'ABORTADO';

interface EquipamentoProcessoId extends String {
  readonly brand: 'EquipamentoProcessoId';
}
```

Backend deve usar estes tipos para garantir **exaustividade** e impedir estados inválidos.
* * *

## 5\. Validação e RLS

### 5.1 Frontend

*   Formulários de `execucao_cip` só permitem transições válidas (`PLANEADO` → `EM_EXECUCAO` → `CONCLUIDO_*` ou `ABORTADO`).

### 5.2 Backend (NestJS)

*   DTOs/validators para `CreateExecucaoCipDto` e `CloseExecucaoCipDto` verificam:
    *   sequências de estado;
    *   existência de `parametro_cip_medido` crítico antes de marcar como `CONCLUIDO_CONFORME`.

### 5.3 BD (Supabase)

*   Constraints `check` nos domínios de estado.
*   Trigger opcional que, ao alterar `execucao_cip.resultado_global` para `NAO_CONFORME`, coloca `estado_higiene = 'BLOQUEADO_POR_CIP_REPROVADO` nos equipamentos envolvidos (ou deixa para a camada de aplicação).

### 5.4 RLS

*   Apenas perfis FSMS/Manutenção podem criar/fechar `execucao_cip`.
*   Apenas Qualidade/FSMS podem alterar `estado_higiene` manualmente.
* * *

## 6\. Riscos e pontos de atenção

*   **Risco de duplicar fontes de verdade**: `estado_higiene` deve existir **apenas em** `equipamento_processo`.
*   **Risco de buracos de rastreio**: se `lote_producao_equipamento` não for preenchido de forma sistemática, perde‑se a ligação entre lotes e CIPs.
* * *

## 7\. Como o programador deve usar este documento

*   Implementar as tabelas de CIP/equipamento diretamente em Supabase.
*   Ligar os serviços MES/FSMS/LIMS a partir destas chaves e estados, reutilizando os tipos TS sugeridos.
*   Garantir que qualquer tentativa de uso de equipamento bloqueado é travada na camada de aplicação e refletida no estado de higiene.