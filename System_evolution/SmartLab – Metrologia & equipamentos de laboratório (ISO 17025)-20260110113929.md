# SmartLab – Metrologia & equipamentos de laboratório (ISO 17025)

# SmartLab – Metrologia & equipamentos de laboratório (ISO 17025)

> Este documento modela o subdomínio de **equipamentos de laboratório e metrologia**, garantindo rastreabilidade ISO 17025 e ligação direta a resultados de ensaio, NC e auditorias.
* * *

## 1\. Entidades principais e estados

### 1.1 `equipamento_laboratorio`

```sql
equipamento_laboratorio (
  id uuid pk,
  tenant_id uuid,
  codigo text unique,
  descricao text,
  categoria text,           -- balanca, estufa, incubadora, etc.
  fabricante text,
  modelo text,
  numero_serie text,
  localizacao text,
  faixa_medicao text,
  incerteza_tipica text,
  estado_metrologico text check in ('APTO','EM_CALIBRACAO','REPROVADO','FORA_DE_SERVICO'),
  data_estado_metrologico timestamptz,
  proxima_calibracao_prevista date,
  ... audit ...
)
```

### 1.2 `certificado_calibracao`

```sql
certificado_calibracao (
  id uuid pk,
  tenant_id uuid,
  equipamento_laboratorio_id uuid fk equipamento_laboratorio,
  numero_certificado text,
  emissor text,
  data_calibracao date,
  data_validade date,
  resultado text check in ('APTO','REPROVADO'),
  incerteza_informada text,
  arquivo_url text,  -- ligação ao PDF do certificado
  ... audit ...
)
```

### 1.3 `intervencao_manutencao`

```sql
intervencao_manutencao (
  id uuid pk,
  tenant_id uuid,
  equipamento_laboratorio_id uuid fk equipamento_laboratorio,
  tipo text check in ('CORRETIVA','PREVENTIVA'),
  descricao text,
  impacta_calibracao boolean,
  realizado_em timestamptz,
  realizado_por uuid fk usuario,
  ... audit ...
)
```

### 1.4 Estados metrológicos como tipo (TypeScript conceitual)

```plain
type EstadoMetrologico =
  | 'APTO'
  | 'EM_CALIBRACAO'
  | 'REPROVADO'
  | 'FORA_DE_SERVICO';

interface EquipamentoLaboratorioId extends String {
  readonly brand: 'EquipamentoLaboratorioId';
}
```

> **Invariantes de metrologia**Nenhum ensaio crítico pode usar equipamento com `estado_metrologico != 'APTO'` ou certificado vencido.Mudança para `REPROVADO` ou `FORA_DE_SERVICO` exige avaliação de impacto em resultados recentes.
* * *

## 2\. Ligação a resultados de ensaio e auditorias

### 2.1 Extensão de `ensaio_laboratorial` / `resultado_ensaio`

```sql
ensaio_laboratorial (
  id uuid pk,
  tenant_id uuid,
  amostra_id uuid fk amostra,
  equipamento_laboratorio_id uuid fk equipamento_laboratorio,
  tipo text,
  metodo text,
  norma text,
  eh_critico boolean default false,
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
```

**Regra crítica (enforçada em backend + RLS):**
> ao criar `ensaio_laboratorial`, backend verifica se `equipamento_laboratorio` está `APTO` e se o último `certificado_calibracao` com `resultado = 'APTO'` ainda está dentro da validade.

### 2.2 Ligação a `nao_conformidade` e auditorias

```sql
nao_conformidade (
  ...,
  origem text check in ('LIMS','PCC','CIP','FORNECEDOR','AUDITORIA','METROLOGIA','BPF'),
  equipamento_laboratorio_id uuid fk equipamento_laboratorio null,
  certificado_calibracao_id uuid fk certificado_calibracao null,
  ...
)
```

Cadeias típicas de rastreio em auditoria:
*   Auditoria → `nao_conformidade` (`origem = 'METROLOGIA'`) → `equipamento_laboratorio` → `certificado_calibracao`.
*   Resultado crítico → `ensaio_laboratorial` → `equipamento_laboratorio` → certificado aplicável.
* * *

## 3\. Regras de negócio (ISO 17025)

1. **Seleção de equipamento em ensaio**
    *   UI de LIMS lista apenas equipamentos com:
        *   `estado_metrologico = 'APTO'`;
        *   certificado mais recente com `resultado = 'APTO'` e `data_validade >= today()`.
    *   Tentativa de usar equipamento fora destas condições → erro bloqueante.
2. **Mudança de estado para** **`REPROVADO`** **/** **`FORA_DE_SERVICO`**
    *   Dispara rotina que:
        *   identifica `resultado_ensaio` críticos emitidos em intervalo configurável (ex: últimos 90 dias);
        *   marca estes resultados para **revisão** e, se necessário, abre `nao_conformidade` de metrologia.
3. **Planeamento de calibrações**
    *   View ou função que devolve equipamentos com `data_validade` próxima/expirada.
    *   Alimenta dashboards e notificações automáticas.
4. **Rastreabilidade completa de resultado**
    *   Para cada `resultado_ensaio` crítico é possível reconstruir:
        *   `resultado_ensaio` → `ensaio_laboratorial` → `amostra` → `lote_producao`/`lote_materia_prima` + `equipamento_laboratorio` → `certificado_calibracao` → eventuais `nao_conformidade`.
* * *

## 4\. Validação em múltiplas camadas

### 4.1 Frontend React/TypeScript

*   Tipos fortes para `EstadoMetrologico` e DTOs de cadastro de equipamento/certificado.
*   Formulários impedem datas incoerentes (ex: `data_validade < data_calibracao`).

### 4.2 Backend NestJS

*   Schemas (Zod/class-validator) para:
    *   `CreateEquipamentoLaboratorioDto`
    *   `CreateCertificadoCalibracaoDto`
    *   `CreateEnsaioLaboratorialDto` (com validação de estado do equipamento).
*   Guards de negócio para garantir que estados só transitam via fluxos válidos.

### 4.3 BD / Supabase

*   Constraints `check` para domínios (`estado_metrologico`, `resultado` do certificado).
*   FKs obrigatórias para garantir que não há ensaios sem equipamento quando o método exige equipamento calibrado.
* * *

## 5\. Riscos e pontos de atenção

*   **Risco de sub‑modelagem**: não armazenar `numero_certificado`, `emissor` e `arquivo_url` enfraquece a evidência em auditorias ISO 17025.
*   **Risco de performance**: queries de impacto metrológico (muitos resultados históricos) podem ser pesadas; mitigar com índices em `(equipamento_laboratorio_id, created_at)` em `resultado_ensaio`.
* * *

## 6\. Como o programador deve usar este documento

*   Implementar estas tabelas em Supabase como **fonte de verdade de metrologia**.
*   Expor serviços NestJS que impõem as regras de seleção de equipamento e estado metrológico.
*   Derivar tipos TS (`EquipamentoLaboratorio`, `CertificadoCalibracao`, etc.) e partilhar entre frontend e backend para evitar `any` e estados inválidos.