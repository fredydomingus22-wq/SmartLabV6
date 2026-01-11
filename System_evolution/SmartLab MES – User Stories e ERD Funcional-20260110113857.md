# SmartLab MES – User Stories e ERD Funcional

# SmartLab MES – User Stories e ERD Funcional

## 1\. Objetivo do módulo MES no SmartLab

O módulo MES do SmartLab Enterprise é o **orquestrador da execução de produção por lote**, garantindo que cada lote:

*   nasce a partir de uma **Ordem de Produção** formal;
*   é sempre ligado a **produto, linha, turno, matérias‑primas e equipamentos de processo**;
*   só pode ser **liberado** quando a Qualidade confirmar conformidade com base em:
    *   resultados laboratoriais (LIMS),
    *   controlo de PCC/HACCP e CIPs (FSMS),
    *   NC/CAPA e desvios de processo (QMS).

O MES é, portanto, o **ponto de convergência** onde se comprova, em auditoria, que **Qualidade comanda Produção**.
* * *

## 2\. ERD funcional do MES e seus intervenientes

### 2.1. Entidades core do MES

*   **UnidadeIndustrial**
*   **LinhaProducao** (FK → UnidadeIndustrial)
*   **Produto**
*   **OrdemProducao** (FK → Produto, LinhaProducao)
*   **LoteProducao** (FK → OrdemProducao, Produto, LinhaProducao)
*   **Turno**
*   **EventoProducao** (FK → LoteProducao, LinhaProducao, opcional EquipamentoProcesso)
*   **LoteMateriaPrima** (interveniente direto do módulo de Materiais & Fornecedores)
*   **LoteProducaoMateriaPrima** (join LoteProducao ↔ LoteMateriaPrima)
*   **EquipamentoProcesso** (tanques, enchedoras, pasteurizadores, etc.)
*   **LoteProducaoEquipamento** (join LoteProducao ↔ EquipamentoProcesso)

Campos de estado principais em **LoteProducao**:

*   `status_execucao`: PLANEJADO | EM\_EXECUCAO | CONCLUIDO
*   `status_qualidade`: AGUARDANDO\_ANALISES | AGUARDANDO\_LIBERACAO\_QUALIDADE | LIBERADO | BLOQUEADO | SEGREGADO | DESCARTADO

### 2.2. Intervenientes e integrações chave

**LIMS (Laboratório & Metrologia)**

*   **PlanoAmostragem**, **PlanoAmostragemItem**
*   **Amostra** (FK opcional → LoteProducao, ExecucaoCIP)
*   **EnsaioLaboratorial**, **ResultadoEnsaio**, **LaudoLote**
*   **EquipamentoLaboratorio**, **CertificadoCalibracao**, **EstadoMetrologico**

Relação com MES:

*   `Amostra.lote_producao_id` → `LoteProducao.id`
*   `LaudoLote.lote_producao_id` → `LoteProducao.id`
*   decisões de qualidade do lote usam **ResultadoEnsaio** + **LaudoLote**.

**FSMS / HACCP / PCC / CIPs**

*   **PlanoHACCP**, **PontoControleCritico (PCC)**, **MonitorizacaoPCC**
*   **CircuitoCIP**, **PontoCIP/PontoHigiene**
*   **ExecucaoCIP**, **ExecucaoCIPLeitura**, **EstadoHigieneEquipamento**

Relação com MES:

*   `MonitorizacaoPCC.lote_producao_id` → `LoteProducao.id` (quando aplicável)
*   `LoteProducaoEquipamento` ↔ `EquipamentoProcesso.estado_higiene`
*   bloqueios no lote podem ser disparados por PCC/CIP.

**QMS (NC, CAPA, Auditorias)**

*   **NaoConformidade**, **AcaoCAPA**, **Auditoria**
*   **VinculoNcEntidade** (liga NC a LoteProducao, LoteMateriaPrima, ExecucaoCIP, ResultadoEnsaio, MonitorizacaoPCC, EquipamentoLaboratorio, etc.)

Relação com MES:

*   decisões de bloqueio/liberação de lote consultam NC críticas/maiores ligadas a:
    *   LoteProducao,
    *   Lotes de MP consumidos,
    *   Execucoes CIP associadas,
    *   Resultados de ensaio, PCC e equipamentos.

**Materiais & Fornecedores**

*   **Fornecedor**, **MateriaPrima/MaterialEmbalagem**, **LoteMateriaPrima**, **InspecaoRecepcao**, **AvaliacaoFornecedor**

Relação com MES:

*   `LoteProducaoMateriaPrima` liga LoteProducao ↔ LoteMateriaPrima ↔ Fornecedor.
*   estado de qualidade de LoteMateriaPrima impacta estado de LoteProducao.

### 2.3. Eventos de domínio chave

No contexto MES, os principais eventos de domínio que precisam ser rastreáveis são:

*   **LoteProducaoAberto** (com contexto de Ordem, Produto, Linha, Turno, Equipamentos previstos)
*   **LoteProducaoAtualizado** (mudanças significativas de parâmetros)
*   **LoteProducaoEncerrado** (fim físico de produção)
*   **LoteProducaoEstadoQualidadeAlterado** (mudança AGUARDANDO\_ANALISES → LIBERADO/BLOQUEADO/SEGREGADO/DESCARTADO)
*   **EquipamentoAssociadoAoLote** / **EquipamentoRemovidoDoLote**
*   **ConsumoDeLoteMateriaPrimaRegistado**

Estas entradas alimentam tanto **auditorias** como **relatórios de rastreabilidade**.
* * *

## 3\. User stories MES por fluxo

### 3.1. Planeamento e abertura de lote de produção

**MES‑01 – Abertura de lote com contexto completo e ganchos para qualidade**

Como **Supervisor de Turno**
Quero **abrir um LoteProducao a partir de uma OrdemProducao, já ligado a produto, linha, turno, matérias‑primas previstas e equipamentos principais**
Para **garantir rastreabilidade ponta‑a‑ponta e que planos de amostragem e HACCP sejam disparados automaticamente**

Critérios de Aceitação:
*   É possível selecionar uma **OrdemProducao** em estado _Planejada_ e abrir um ou mais **LoteProducao** filhos.
*   Ao abrir o lote, o sistema obriga a informar **linha, turno, equipamentos críticos** e, quando conhecido, os **lotes de matéria‑prima principais**.
*   O sistema dispara automaticamente a ligação com **PlanoAmostragem** (LIMS) e **PlanoHACCP/PCC** (FSMS), registando os IDs de plano no LoteProducao.
*   O lote nasce com `status_execucao = EM_EXECUCAO` e `status_qualidade = AGUARDANDO_ANALISES`.
*   Cada ação de abertura gera evento de domínio **LoteProducaoAberto** em _AuditLog_ com utilizador, timestamp e contexto.

Módulo: **MES**
Normas relacionadas: **ISO 9001, ISO 22000, HACCP**

ERD Mental (conceitual):
*   Entidades:
    *   OrdemProducao, LoteProducao, LinhaProducao, Turno, LoteMateriaPrima, EquipamentoProcesso, PlanoAmostragem, PlanoHACCP.
*   Relações:
    *   OrdemProducao 1..N LoteProducao;
    LoteProducao 1..N LoteProducaoMateriaPrima ↔ LoteMateriaPrima;
    LoteProducao 1..N LoteProducaoEquipamento ↔ EquipamentoProcesso;
    LoteProducao → PlanoAmostragem, PlanoHACCP (via FK ou relação indireta por produto/linha).
*   Eventos críticos:
    *   LoteProducaoAberto, ConsumoDeLoteMateriaPrimaRegistado, EquipamentoAssociadoAoLote.
* * *

### 3.2. Execução e registo de produção no MES

**MES‑02 – Registo estruturado de eventos de produção por lote**

Como **Operador de Produção**
Quero **registar eventos de produção (início, fim, paragens, sucata, ajustes) diretamente contra o LoteProducao**
Para **ter uma visão completa do que aconteceu durante a execução e permitir análise posterior de OEE, paragens e sucata por lote**

Critérios de Aceitação:
*   É possível selecionar o **LoteProducao em execução** e registar:
    *   início/fim de produção;
    *   paragens (com motivo normalizado);
    *   quantidade produzida e quantidade de sucata/reprocesso;
    *   trocas de equipamentos relevantes.
*   Cada registo cria um **EventoProducao** ligado a LoteProducao, LinhaProducao, Turno e, se aplicável, EquipamentoProcesso.
*   O sistema impede registos em Lotes com `status_execucao != EM_EXECUCAO`.
*   Todos os eventos são visíveis em linha temporal por LoteProducao, com utilizador e timestamp.

Módulo: **MES**
Normas relacionadas: **ISO 9001** (rastreabilidade de processo), **BPF**

ERD Mental (conceitual):
*   Entidades:
    *   LoteProducao, EventoProducao, LinhaProducao, Turno, EquipamentoProcesso.
*   Relações:
    *   LoteProducao 1..N EventoProducao;
    EventoProducao → LinhaProducao, Turno, opcionalmente EquipamentoProcesso.
*   Eventos críticos:
    *   LoteProducaoAberto, EventoProducaoRegistado, LoteProducaoEncerrado.
* * *

### 3.3. Integração MES ↔ LIMS (amostragem e resultados)

**MES‑03 – Disparo automático do plano de amostragem ao abrir/encerrar lote**

Como **Técnico de Qualidade em Linha**
Quero **que, ao abrir ou encerrar um LoteProducao, o sistema gere automaticamente as Amostras obrigatórias no LIMS**
Para **evitar falhas de amostragem e garantir conformidade com o plano de controlo e HACCP**

Critérios de Aceitação:
*   Para cada LoteProducao, o sistema identifica o **PlanoAmostragem** aplicável com base em Produto, LinhaProducao, PCC relevantes e fase do processo.
*   Ao abrir/encerrar o lote, o MES chama o serviço de **SamplingPlanService** que cria **Amostras** no LIMS com:
    *   tipo (processo, produto acabado, MP, ambiente, água, superfície);
    *   referência ao `lote_producao_id`;
    *   data/hora alvo de coleta;
    *   lista de parâmetros/ensaios obrigatórios.
*   O estado inicial das Amostras é **AGUARDANDO\_COLETA**.
*   Falhas sistemáticas na geração de Amostras (por erro de configuração) são registadas como **NC de sistema** no QMS.

Módulo: **MES** (em integração direta com LIMS)
Normas relacionadas: **ISO 22000, HACCP, ISO 17025**

ERD Mental (conceitual):
*   Entidades:
    *   LoteProducao, PlanoAmostragem, PlanoAmostragemItem, Amostra, EnsaioLaboratorial, ResultadoEnsaio.
*   Relações:
    *   PlanoAmostragem 1..N PlanoAmostragemItem;
    LoteProducao → PlanoAmostragem;
    LoteProducao 1..N Amostra;
    Amostra 1..N EnsaioLaboratorial → 1..N ResultadoEnsaio.
*   Eventos críticos:
    *   LoteProducaoAberto, LoteProducaoEncerrado, AmostrasGeradasParaLote.
* * *

### 3.4. Integração MES ↔ FSMS (HACCP, PCC e CIPs)

**MES‑04 – Validação de condições de PCC antes e durante o lote**

Como **Responsável de Segurança Alimentar (FSMS)**
Quero **que o MES verifique automaticamente, para cada LoteProducao, se os PCC associados estão dentro dos limites críticos**
Para **garantir que nenhum lote é liberado se algum PCC relevante estiver fora de controlo sem NC tratada**

Critérios de Aceitação:
*   Cada LoteProducao conhece o seu **PlanoHACCP** e os **PCC** relevantes (por produto/linha).
*   Durante a execução e no fecho do lote, o MES consulta **MonitorizacaoPCC** para o intervalo de produção desse LoteProducao.
*   Se existir valor fora de limite crítico sem **NaoConformidade** tratada, o lote não pode ser marcado como **LIBERADO**; o estado de qualidade fica **BLOQUEADO**.
*   A tentativa de liberação com PCC fora de controlo gera registo em **AuditLog** e pode abrir NC automática.

Módulo: **MES** (integrado a FSMS/HACCP)
Normas relacionadas: **ISO 22000, HACCP**

ERD Mental (conceitual):
*   Entidades:
    *   PlanoHACCP, PCC, MonitorizacaoPCC, LoteProducao, NaoConformidade.
*   Relações:
    *   PlanoHACCP 1..N PCC;
    PCC 1..N MonitorizacaoPCC;
    MonitorizacaoPCC → opcional LoteProducao;
    NaoConformidade ↔ MonitorizacaoPCC e/ou LoteProducao.
*   Eventos críticos:
    *   MonitorizacaoPccRegistada, NaoConformidadeCriadaPorPcc, TentativaLiberacaoLoteComPccForaDeLimite.

**MES‑05 – Bloqueio de uso de equipamento sem CIP conforme**

Como **Supervisor de Produção**
Quero **que o MES impeça a associação de um EquipamentoProcesso a um novo LoteProducao quando o seu estado de higiene não for LiberadoUso**
Para **evitar que lotes sejam produzidos em equipamentos sem CIP conforme, reduzindo risco de contaminação**

Critérios de Aceitação:
*   Cada EquipamentoProcesso tem campo `estado_higiene` (LIBERADO\_USO, REQUER\_CIP, EM\_CIP, BLOQUEADO\_POR\_CIP\_REPROVADO) e `data_ultimo_cip_conforme`.
*   Ao selecionar equipamentos para um novo LoteProducao, o MES verifica:
    *   se `estado_higiene = LIBERADO_USO`;
    *   se o tempo desde `data_ultimo_cip_conforme` não excede o máximo configurado para produto/linha.
*   Se a verificação falhar, o sistema:
    *   bloqueia a criação/associação do equipamento ao lote;
    *   apresenta mensagem clara ao utilizador;
    *   pode sugerir abertura de **ExecucaoCIP**.
*   Eventos e decisões ficam registados em **AuditLog**.

Módulo: **MES** (integrado a FSMS/CIP)
Normas relacionadas: **ISO 22000, HACCP, BPF**

ERD Mental (conceitual):
*   Entidades:
    *   EquipamentoProcesso, CircuitoCIP, ExecucaoCIP, LoteProducao, LoteProducaoEquipamento.
*   Relações:
    *   CircuitoCIP 1..N ExecucaoCIP;
    ExecucaoCIP 1..N EquipamentoProcesso;
    EquipamentoProcesso 1..N LoteProducaoEquipamento → LoteProducao.
*   Eventos críticos:
    *   ExecucaoCipConcluida, EstadoHigieneEquipamentoAtualizado, TentativaAssociarEquipamentoNaoLiberado.
* * *

### 3.5. Encerramento de lote e decisão de qualidade (Qualidade comanda Produção)

**MES‑06 – Encerramento de lote com decisão automática de qualidade**

Como **Responsável de Qualidade**
Quero **que, ao encerrar um LoteProducao no MES, o sistema execute automaticamente a decisão de qualidade consolidando LIMS, FSMS e QMS**
Para **garantir que nenhum lote é liberado sem evidência completa de conformidade e sem NC críticas abertas**

Critérios de Aceitação:
*   Ao encerrar o LoteProducao, o MES chama um serviço de decisão (QualityDecisionService) que verifica:
    *   se todos os **ResultadoEnsaio** obrigatórios do LoteProducao estão presentes e com `status_validacao = VALIDADO_QUALIDADE`;
    *   se não há **ResultadoEnsaio** reprovado com criticidade MAIOR/CRITICA sem NC tratada;
    *   se não há **MonitorizacaoPCC** fora de limite crítico sem NC tratada;
    *   se não existem **NC** de severidade MAIOR/CRITICA abertas para o LoteProducao ou LotesMateriaPrima consumidos;
    *   se equipamentos de processo usados não estão **BLOQUEADO\_POR\_CIP\_REPROVADO**.
*   Em função da consolidação, o sistema define `status_qualidade` do lote como:
    *   **LIBERADO**,
    *   **BLOQUEADO**, ou
    *   **SEGREGADO**.
*   A transição de estado é gravada em **AuditLog** com referência explícita aos artefactos usados na decisão (Laudo, NC, PCC, CIP, etc.).

Módulo: **MES** (núcleo de orquestração de decisão)
Normas relacionadas: **ISO 9001, ISO 22000, ISO 17025, HACCP**

ERD Mental (conceitual):
*   Entidades:
    *   LoteProducao, ResultadoEnsaio, LaudoLote, MonitorizacaoPCC, NaoConformidade, LoteMateriaPrima, LoteProducaoMateriaPrima, EquipamentoProcesso, ExecucaoCIP.
*   Relações:
    *   LoteProducao ↔ ResultadoEnsaio / LaudoLote;
    LoteProducao ↔ LoteProducaoMateriaPrima ↔ LoteMateriaPrima;
    LoteProducao ↔ MonitorizacaoPCC;
    NaoConformidade ↔ (ResultadoEnsaio, MonitorizacaoPCC, ExecucaoCIP, LoteProducao, LoteMateriaPrima);
    LoteProducao ↔ LoteProducaoEquipamento ↔ EquipamentoProcesso ↔ ExecucaoCIP.
*   Eventos críticos:
    *   LoteProducaoEncerrado, EstadoQualidadeLoteAlterado, NaoConformidadeCriada, LaudoLoteEmitido.
* * *

### 3.6. Materiais & fornecedores na perspetiva do MES

**MES‑07 – Consumo rastreável de matérias‑primas por lote**

Como **Operador de Recepção / Supervisor de Produção**
Quero **registar, para cada LoteProducao, exatamente quais LotesMateriaPrima foram consumidos e em que quantidades**
Para **garantir rastreabilidade de montante e jusante e permitir bloqueio de lotes de produto acabado caso uma matéria‑prima seja reprovada a posteriori**

Critérios de Aceitação:
*   Durante a execução do lote, o operador consegue selecionar **LotesMateriaPrima** aprovados para consumo.
*   Cada consumo gera um registo em **LoteProducaoMateriaPrima** com quantidade, unidade e timestamp.
*   O sistema impede o consumo de LotesMateriaPrima com estado de qualidade **Bloqueado** (ou equivalente).
*   Se um LoteMateriaPrima for posteriormente bloqueado, o sistema consegue listar todos os LoteProducao afetados, permitindo bloqueio retroativo.

Módulo: **MES** (com Materiais & Fornecedores)
Normas relacionadas: **ISO 22000, ISO 9001, HACCP**

ERD Mental (conceitual):
*   Entidades:
    *   LoteMateriaPrima, LoteProducao, LoteProducaoMateriaPrima, Fornecedor, NaoConformidade.
*   Relações:
    *   LoteMateriaPrima → Fornecedor;
    LoteProducao 1..N LoteProducaoMateriaPrima → LoteMateriaPrima;
    NaoConformidade ↔ LoteMateriaPrima e LoteProducao.
*   Eventos críticos:
    *   ConsumoDeLoteMateriaPrimaRegistado, LoteMateriaPrimaBloqueado, LoteProducaoBloqueadoPorMp.
* * *

### 3.7. Relatórios operacionais e de auditoria a partir do MES

**MES‑08 – Relatório integrado de lote para auditoria**

Como **Auditor Externo ou Responsável de Qualidade**
Quero **consultar um relatório único por LoteProducao que reúna dados de produção, qualidade, segurança alimentar, metrologia e NC/CAPA**
Para **demonstrar em auditoria que cada lote liberado cumpriu todos os requisitos normativos e de processo**

Critérios de Aceitação:
*   Para qualquer LoteProducao, é possível gerar um **Relatório de Lote Integrado** contendo:
    *   dados de OrdemProducao (produto, quantidade planeada vs. produzida, linha, turno);
    *   eventos principais de produção (paragens, sucata, reprocessos);
    *   resumo de **ResultadoEnsaio** e **LaudoLote** (parâmetros críticos, limites, valores medidos, conformidade);
    *   situação de **MonitorizacaoPCC** relevante (incluindo desvios e NC, se existirem);
    *   estado de **ExecucoesCIP** associadas aos EquipamentosProcesso usados;
    *   estado metrológico dos **EquipamentoLaboratorio** utilizados nas análises críticas;
    *   lista de **NaoConformidades** ligadas ao lote (produto, processo, MP, PCC, CIP, metrologia) e estado de CAPA.
*   O relatório apresenta claramente o `status_qualidade` final do lote e quem o aprovou, com data/hora.
*   O formato é adequado para exportação (PDF/Excel) e anexação em auditorias.

Módulo: **MES** (relatórios integrados)
Normas relacionadas: **ISO 9001, ISO 22000, ISO 17025, HACCP**

ERD Mental (conceitual):
*   Entidades:
    *   LoteProducao, OrdemProducao, EventoProducao, ResultadoEnsaio, LaudoLote, MonitorizacaoPCC, ExecucaoCIP, EquipamentoProcesso, EquipamentoLaboratorio, NaoConformidade, AcaoCAPA.
*   Relações:
    *   LoteProducao ↔ (OrdemProducao, EventoProducao, ResultadoEnsaio/LaudoLote, MonitorizacaoPCC, LoteProducaoEquipamento ↔ EquipamentoProcesso, LoteProducaoMateriaPrima ↔ LoteMateriaPrima);
    ExecucaoCIP ↔ EquipamentoProcesso;
    ResultadoEnsaio ↔ EquipamentoLaboratorio;
    NaoConformidade/AcaoCAPA ↔ todas as entidades críticas.
*   Eventos críticos:
    *   RelatorioLoteGerado, EstadoQualidadeLoteAlterado, AuditoriaConsultouLote.
* * *

## 4\. Nota de alinhamento com o ERD funcional integrado

As user stories e o ERD funcional acima **especializam o módulo MES e os seus intervenientes diretos**, tomando como base o ERD funcional integrado já documentado (Produção/MES, LIMS+Metrologia, QMS/FSMS, Materiais & Fornecedores, Engenharia de Produto, Relatórios/BI, IA/SPC).

*   O foco aqui está na **orquestração por LoteProducao** e no papel do MES como **camada de decisão operacional**.
*   LIMS, FSMS/HACCP, QMS, Materiais & Fornecedores, Equipamentos/CIP e Metrologia entram como **bounded contexts integrados**, com chaves fortes (`LoteProducaoId`, `LoteMateriaPrimaId`, `EquipamentoProcessoId`, `EquipamentoLaboratorioId`, `PlanoHaccpId`, `PccId`, `PlanoAmostragemId`).
*   Este conteúdo deve ser usado como **fonte para backlog** (stories MES‑01…MES‑08) e como referência funcional direta para o desenho de esquema físico (Supabase) e serviços de backend.