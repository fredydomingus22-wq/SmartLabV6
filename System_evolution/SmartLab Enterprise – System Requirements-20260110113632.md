# SmartLab Enterprise – System Requirements

# SmartLab Enterprise – System Requirements

## 1\. Introdução

Este documento define os **Requisitos do Sistema** do **SmartLab Enterprise**, organizados em:

*   **Requisitos Funcionais**, estruturados por módulo (MES, LIMS, QMS, FSMS, Gestão de Materiais, Engenharia de Produto, Relatórios & BI, IA & SPC).
*   **Requisitos Não Funcionais**, agrupados por domínios críticos: Segurança, Audit Trail, Integridade de Dados, Performance, Disponibilidade, Usabilidade Industrial e Conformidade Regulatória.

Os requisitos foram elaborados considerando:

*   Indústrias de **alimentos e bebidas em Angola e África**.
*   Conformidade com **ISO 9001, ISO 22000, ISO 17025, HACCP e BPF**.
*   Princípio **Quality-First**: decisões de produção ancoradas em dados de Qualidade, Laboratório e FSMS.
*   Realidade de **infraestrutura limitada**, necessidade de robustez a falhas de conectividade e baixa maturidade digital.

Cada requisito funcional segue o seguinte formato obrigatório:

```yaml
ID: RF-XXX
Descrição:
Módulo:
Origem (ISO / HACCP / Operacional):
Prioridade: [Alta | Média | Baixa]
Critério de Aceitação:
```

Os IDs são estruturados como `RF-<MÓDULO>-NNN`, por exemplo `RF-MES-001`.
* * *

## 2\. Requisitos Funcionais por Módulo

### 2.1. Módulo MES – Execução da Produção

```yaml
ID: RF-MES-001
Descrição: O sistema deve permitir o registo e gestão de Ordens de Produção, incluindo produto, quantidade planeada, linha, turno e estado (planeada, em execução, concluída, cancelada).
Módulo: MES
Origem (ISO / HACCP / Operacional): Operacional / ISO 9001 – Planejamento da Produção
Prioridade: Alta
Critério de Aceitação: É possível criar, editar estado e encerrar Ordens de Produção; cada ordem fica associada a uma unidade industrial, linha de produção, produto e turno, e o histórico de estados é consultável por auditor.
```

```yaml
ID: RF-MES-002
Descrição: O sistema deve gerar automaticamente Lotes de Produção a partir de cada Ordem de Produção, com identificação única por produto, data, linha e turno.
Módulo: MES
Origem (ISO / HACCP / Operacional): HACCP – Rastreabilidade de Lotes / ISO 22000 – 8.3
Prioridade: Alta
Critério de Aceitação: Para cada Ordem de Produção criada, o sistema gera um ou mais Lotes de Produção com código único; é possível localizar um lote a partir da ordem, do produto, da data ou da linha.
```

```yaml
ID: RF-MES-003
Descrição: O sistema deve permitir o registo de consumos de Lotes de Matéria-Prima por Lote de Produção, incluindo fornecedor, número do lote de origem e quantidades consumidas.
Módulo: MES
Origem (ISO / HACCP / Operacional): ISO 22000 – Rastreabilidade / HACCP – Análise de Perigos
Prioridade: Alta
Critério de Aceitação: Para qualquer Lote de Produção, é possível listar todos os Lotes de Matéria-Prima consumidos, com fornecedor e quantidades; em auditoria, um inspetor consegue seguir a cadeia MP → Produto Acabado.
```

```yaml
ID: RF-MES-004
Descrição: O sistema deve permitir o registo de paragens de linha (planeadas e não planeadas), com motivo categorizado (manutenção, qualidade, falta de MP, falha de energia, etc.).
Módulo: MES
Origem (ISO / HACCP / Operacional): Operacional / Melhoria Contínua (ISO 9001)
Prioridade: Média
Critério de Aceitação: O utilizador consegue registar uma paragem, classificá-la, associá-la a uma linha e lote; relatórios de OEE conseguem consumir estes dados por período, linha e motivo.
```

```yaml
ID: RF-MES-005
Descrição: O sistema deve permitir o bloqueio de Lotes de Produção pela Qualidade, impedindo o seu estado de conclusão ou expedição até decisão explícita de liberação.
Módulo: MES
Origem (ISO / HACCP / Operacional): ISO 22000 – Controlo de Produto Não Conforme / HACCP – Ações Corretivas
Prioridade: Alta
Critério de Aceitação: Um utilizador com perfil de Qualidade consegue marcar um lote como bloqueado; enquanto bloqueado, o lote não pode ser marcado como liberado nem incluído em ordens de expedição; o histórico de bloqueio/liberação fica registado em audit trail.
```

```yaml
ID: RF-MES-006
Descrição: O sistema deve permitir o registo de quantidades produzidas, refugos e retrabalho por Lote de Produção.
Módulo: MES
Origem (ISO / HACCP / Operacional): ISO 9001 – Medição e Melhoria / Operacional
Prioridade: Média
Critério de Aceitação: Para cada Lote de Produção, é possível registar produção boa, refugos e retrabalho; relatórios apresentam rendimento por lote, linha, turno e período.
```

```yaml
ID: RF-MES-007
Descrição: O sistema deve permitir a associação de resultados de qualidade (LIMS/FSMS) ao estado de cada Lote de Produção.
Módulo: MES
Origem (ISO / HACCP / Operacional): ISO 22000 / HACCP – Verificação / Integração LIMS-MES
Prioridade: Alta
Critério de Aceitação: O estado de qualidade do lote (Aprovado, Reprovado, Aguardando Resultados, Bloqueado) é derivado dos resultados laboratoriais e monitorização de PCC; em auditoria, é possível listar quais resultados sustentam a liberação.
```

### 2.2. Módulo LIMS – Laboratório

```yaml
ID: RF-LIMS-001
Descrição: O sistema deve permitir o registo de Amostras de produto, matéria-prima, ambiente e água, com identificação de origem (lote, linha, ponto de amostragem) e plano de amostragem associado.
Módulo: LIMS
Origem (ISO / HACCP / Operacional): ISO 17025 – Rastreabilidade de Amostras / HACCP – Plano de Amostragem
Prioridade: Alta
Critério de Aceitação: Para qualquer amostra, é possível identificar quem a recolheu, quando, em que ponto, para qual lote e qual plano de amostragem; a rastreabilidade é verificável em auditoria.
```

```yaml
ID: RF-LIMS-002
Descrição: O sistema deve permitir o lançamento de Ensaios Laboratoriais (microbiológicos e físico-químicos) para cada amostra.
Módulo: LIMS
Origem (ISO / HACCP / Operacional): ISO 17025 – Ensaios / ISO 22000 – Verificação
Prioridade: Alta
Critério de Aceitação: A partir de uma amostra, o utilizador consegue registar os ensaios realizados, métodos, equipamentos e resultados; todos os ensaios ficam ligados à amostra e ao lote de origem.
```

```yaml
ID: RF-LIMS-003
Descrição: O sistema deve suportar limites de especificação por produto, parâmetro e tipo de amostra, indicando automaticamente se o resultado está Conforme/Não Conforme.
Módulo: LIMS
Origem (ISO / HACCP / Operacional): HACCP – Critérios Críticos / ISO 22000 – 8.5
Prioridade: Alta
Critério de Aceitação: Para cada resultado lançado, o sistema compara automaticamente com o limite de especificação configurado e atribui o estado; é possível configurar limites por produto e parâmetro.
```

```yaml
ID: RF-LIMS-004
Descrição: O sistema deve permitir o registo de equipamentos de laboratório, calibrações e certificados metrológicos.
Módulo: LIMS
Origem (ISO / HACCP / Operacional): ISO 17025 – Equipamentos de Medição
Prioridade: Alta
Critério de Aceitação: Cada equipamento possui histórico de calibração e certificados anexos; em auditoria, é possível comprovar que o equipamento estava dentro do prazo na data do ensaio.
```

```yaml
ID: RF-LIMS-005
Descrição: O sistema deve impedir marcação de resultados como válidos caso o equipamento esteja com calibração vencida.
Módulo: LIMS
Origem (ISO / HACCP / Operacional): ISO 17025 – Validade de Resultados
Prioridade: Alta
Critério de Aceitação: Quando um equipamento com calibração vencida é selecionado para um ensaio, o sistema emite alerta e não permite a conclusão do resultado até regularização.
```

### 2.3. Módulo QMS – Gestão da Qualidade

```yaml
ID: RF-QMS-001
Descrição: O sistema deve permitir o registo e gestão de Não Conformidades (NC) oriundas de produção, laboratório, auditorias e reclamações de cliente.
Módulo: QMS
Origem (ISO / HACCP / Operacional): ISO 9001 – 10.2 / ISO 22000 – NC
Prioridade: Alta
Critério de Aceitação: É possível criar NC, categorizar origem, gravidade e impacto, associar a lote, linha, cliente ou auditoria; o histórico de NC é extraível por período e categoria.
```

```yaml
ID: RF-QMS-002
Descrição: O sistema deve permitir a abertura e gestão de planos CAPA associados a NC.
Módulo: QMS
Origem (ISO / HACCP / Operacional): ISO 9001 – Ações Corretivas e Preventivas
Prioridade: Alta
Critério de Aceitação: Cada NC pode ter uma ou mais CAPA com responsáveis, prazos e ações; o estado das ações é visível em dashboards e relatórios.
```

```yaml
ID: RF-QMS-003
Descrição: O sistema deve registar a relação entre NC críticas e decisões de bloqueio/liberação de lote.
Módulo: QMS
Origem (ISO / HACCP / Operacional): ISO 22000 / HACCP – Ações Corretivas em PCC
Prioridade: Alta
Critério de Aceitação: Para um lote bloqueado por motivo de qualidade, é possível rastrear quais NC e CAPA associadas sustentaram a decisão.
```

### 2.4. Módulo FSMS – Segurança Alimentar

```yaml
ID: RF-FSMS-001
Descrição: O sistema deve permitir a modelação de Planos HACCP por unidade industrial, linha e produto.
Módulo: FSMS
Origem (ISO / HACCP / Operacional): HACCP Codex / ISO 22000
Prioridade: Alta
Critério de Aceitação: Para uma combinação unidade-linha-produto, é possível visualizar o plano HACCP com perigos, PCC, limites críticos, monitorização e ações corretivas.
```

```yaml
ID: RF-FSMS-002
Descrição: O sistema deve permitir o registo de monitorizações de PCC, com valores medidos, estado (dentro/fora de especificação) e ações tomadas.
Módulo: FSMS
Origem (ISO / HACCP / Operacional): HACCP – Monitorização de PCC
Prioridade: Alta
Critério de Aceitação: É possível registar medições de PCC por turno/lote; em auditoria, é possível provar que todos os PCC foram monitorizados na frequência definida.
```

### 2.5. Gestão de Materiais & Fornecedores

```yaml
ID: RF-MAT-001
Descrição: O sistema deve permitir registar Fornecedores, matérias-primas e histórico de desempenho em qualidade.
Módulo: Gestão de Materiais & Fornecedores
Origem (ISO / HACCP / Operacional): ISO 9001 – Avaliação de Fornecedores / ISO 22000 – Controlo de MP
Prioridade: Média
Critério de Aceitação: Para cada fornecedor é possível ver histórico de NC, devoluções e desempenho por período.
```

```yaml
ID: RF-MAT-002
Descrição: O sistema deve permitir registar e rastrear Lotes de Matéria-Prima desde o recebimento até o consumo em Lotes de Produção.
Módulo: Gestão de Materiais & Fornecedores / MES
Origem (ISO / HACCP / Operacional): ISO 22000 – Rastreabilidade / HACCP
Prioridade: Alta
Critério de Aceitação: A partir de um lote de MP, é possível identificar todos os lotes de produto onde foi consumido, e vice-versa.
```

### 2.6. Engenharia de Produto

```yaml
ID: RF-ENG-001
Descrição: O sistema deve permitir definir Fichas Técnicas de Produto, incluindo especificações de qualidade, parâmetros de processo críticos e requisitos de rotulagem.
Módulo: Engenharia de Produto
Origem (ISO / HACCP / Operacional): ISO 9001 – Desenho e Desenvolvimento / ISO 22000 – Controlo de Produto
Prioridade: Média
Critério de Aceitação: Fichas técnicas podem ser ligadas a produtos, lotes e planos de amostragem; alterações são versionadas.
```

### 2.7. Relatórios & BI / IA & SPC

```yaml
ID: RF-BI-001
Descrição: O sistema deve disponibilizar relatórios padronizados para auditorias (lista de NC, CAPA, monitorização de PCC, resultados laboratoriais por período, rastreabilidade de lotes).
Módulo: Relatórios & BI
Origem (ISO / HACCP / Operacional): ISO 9001 / ISO 22000 / ISO 17025 – Evidência Documental
Prioridade: Alta
Critério de Aceitação: Os relatórios podem ser filtrados por período, unidade, linha, produto e cliente; exportáveis em formatos padrão (CSV/PDF).
```

```yaml
ID: RF-SPC-001
Descrição: O sistema deve calcular indicadores SPC básicos (média, desvio padrão, limites de controlo) para parâmetros críticos selecionados.
Módulo: IA & SPC
Origem (ISO / HACCP / Operacional): Melhoria Contínua / Controlo Estatístico de Processo
Prioridade: Média
Critério de Aceitação: Para um parâmetro com SPC ativo, o sistema gera gráficos de controlo e sinaliza pontos fora de controlo.
```

* * *

## 3\. Requisitos Não Funcionais

### 3.1. Segurança

*   Autenticação obrigatória para todos os utilizadores.
*   Perfis de acesso diferenciados (Produção, Qualidade, Laboratório, FSMS, Administração).
*   Encriptação de dados em repouso e em trânsito.

### 3.2. Audit Trail

*   Registo de todas as operações críticas (criação/edição de lotes, resultados laboratoriais, NC, CAPA, planos HACCP, bloqueio/liberação de lote).
*   Possibilidade de exportar trilha de auditoria por utilizador, período e entidade.

### 3.3. Integridade de Dados

*   Validações obrigatórias em campos críticos (datas, códigos de lote, identificadores de amostra).
*   Regras de integridade referencial para relações chave (lote–amostra–resultado, NC–CAPA, PCC–monitorização).

### 3.4. Performance e Disponibilidade

*   Resposta adequada para operações de consulta típicas de auditoria (segundos, não minutos), mesmo com histórico de vários anos.
*   Funcionar adequadamente em infraestruturas com conectividade intermitente, privilegiando operações essenciais com degradação graciosa.

### 3.5. Usabilidade Industrial

*   Interfaces desenhadas para uso em chão de fábrica e laboratório (poucos cliques, campos focados, mensagens de erro claras).
*   Suporte a utilização em turnos, com troca rápida de utilizador.

### 3.6. Conformidade Regulatória

*   Capacidade de comprovar, via relatórios e trilhas, a conformidade com **ISO 9001, ISO 22000, ISO 17025, HACCP e BPF**, alinhada à realidade de auditorias em Angola e África.