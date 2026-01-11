# SmartLab Enterprise – User Stories Industriais por Módulo

# SmartLab Enterprise – User Stories Industriais por Módulo

Este documento reúne um conjunto de **user stories industriais** para cada módulo do SmartLab Enterprise, com foco em perfis reais de fábrica, ações claras no sistema e benefícios mensuráveis na operação, qualidade e auditoria.

Cada bloco segue o formato padrão:

```plain
Como [perfil industrial real]
Quero [ação clara no sistema]
Para [benefício mensurável na fábrica]

Critérios de Aceitação:
- ...
- ...

Módulo: [MES / LIMS / QMS / FSMS / Materiais & Fornecedores / Engenharia de Produto / SPC-BI-IA / Relatórios]
Normas relacionadas: [ISO 9001 / ISO 22000 / HACCP / ISO 17025 / outra]

ERD Mental (conceitual):
- Entidades:
    - ...
- Relações:
    - ...
- Eventos críticos:
    - ...
```

* * *

## 1\. MES – Execução da Produção

### US-MES-001 – Gestão de Ordens de Produção

Como **Supervisor de Turno**
Quero **registar e acompanhar Ordens de Produção por linha, produto e turno**
Para **garantir visibilidade em tempo real do que está planeado, em execução e concluído, facilitando auditorias e análise de desempenho**

Critérios de Aceitação:
*   É possível criar Ordens de Produção informando produto, quantidade planeada, linha, turno e datas planeadas.
*   A ordem possui estados: Planeada, Em Execução, Concluída, Cancelada.
*   É possível filtrar Ordens de Produção por unidade industrial, linha, produto, turno e período.
*   O histórico de mudança de estados fica registado em audit trail consultável.

Módulo: MES
Normas relacionadas: ISO 9001 (planeamento da produção), ISO 22000 (controlo operacional)

ERD Mental (conceitual):
*   Entidades:
    *   OrdemProducao
    *   LinhaProducao
    *   Turno
*   Relações:
    *   OrdemProducao é executada em uma LinhaProducao
    *   OrdemProducao está associada a um Turno
*   Eventos críticos:
    *   Criação da OrdemProducao
    *   Mudança de estado para Em Execução
    *   Mudança de estado para Concluída/Cancelada

### US-MES-002 – Rastreabilidade de Lotes Produzidos

Como **Técnico de Qualidade**
Quero **consultar rapidamente todos os Lotes de Produção gerados por uma Ordem de Produção**
Para **rastrear impactos de desvios de qualidade e responder a auditorias e reclamações de clientes**

Critérios de Aceitação:
*   Para cada Ordem de Produção, o sistema gera um ou mais Lotes de Produção com código único.
*   A partir de um lote é possível navegar para a ordem de origem, produto, linha e turno.
*   É possível filtrar lotes por produto, linha, data, estado de qualidade e cliente (quando aplicável).

Módulo: MES
Normas relacionadas: ISO 22000 (rastreabilidade), HACCP (análise de perigos)

ERD Mental (conceitual):
*   Entidades:
    *   LoteProducao
    *   OrdemProducao
*   Relações:
    *   OrdemProducao gera LoteProducao
*   Eventos críticos:
    *   Criação de LoteProducao
    *   Encerramento de LoteProducao (quantidades e refugos)

### US-MES-003 – Bloqueio de Lotes

Como **Responsável de Segurança Alimentar**
Quero **bloquear rapidamente um Lote de Produção no sistema**
Para **impedir a expedição de produto potencialmente não conforme até conclusão de investigação**

Critérios de Aceitação:
*   Um utilizador com perfil de Qualidade/Segurança Alimentar consegue marcar um lote como Bloqueado.
*   Enquanto bloqueado, o lote não pode ser incluído em ordens de expedição.
*   O sistema regista quem bloqueou, quando, motivo e ligação a NC/CAPA.

Módulo: MES / QMS / FSMS
Normas relacionadas: ISO 22000, HACCP (ações corretivas), ISO 9001 (controlo de produto não conforme)

ERD Mental (conceitual):
*   Entidades:
    *   LoteProducao
    *   NaoConformidade
*   Relações:
    *   LoteProducao pode estar ligado a uma ou mais NaoConformidade
*   Eventos críticos:
    *   Alteração de estado do lote para Bloqueado
    *   Liberação do lote após análise
* * *

## 2\. LIMS – Laboratório

### US-LIMS-001 – Registo de Amostras

Como **Analista de Microbiologia**
Quero **registar amostras de produto, ambiente e água com origem claramente identificada**
Para **garantir rastreabilidade completa entre resultados laboratoriais e lotes/produtos avaliados**

Critérios de Aceitação:
*   É possível registar amostras indicando tipo (produto, matéria-prima, ambiente, água), ponto de amostragem, data/hora, lote (quando aplicável) e plano de amostragem.
*   Cada amostra recebe um identificador único rastreável.
*   É possível pesquisar amostras por lote, produto, data, tipo e ponto de amostragem.

Módulo: LIMS
Normas relacionadas: ISO 17025, ISO 22000, HACCP

ERD Mental (conceitual):
*   Entidades:
    *   Amostra
    *   PlanoAmostragem
    *   LoteProducao
*   Relações:
    *   Amostra segue um PlanoAmostragem
    *   Amostra pode referenciar um LoteProducao
*   Eventos críticos:
    *   Criação da Amostra
    *   Encerramento da Amostra (todos os ensaios concluídos)

### US-LIMS-002 – Lançamento de Resultados e Interpretação Automática

Como **Analista Físico-Químico**
Quero **lançar resultados de ensaios com interpretação automática Conforme/Não Conforme**
Para **reduzir erros manuais e acelerar decisões de liberação de produto**

Critérios de Aceitação:
*   É possível lançar resultados por parâmetro, unidade de medida e equipamento usado.
*   O sistema compara o resultado com o limite de especificação configurado.
*   O estado (Conforme/Não Conforme) é atribuído automaticamente e registado.

Módulo: LIMS
Normas relacionadas: ISO 17025, ISO 22000

ERD Mental (conceitual):
*   Entidades:
    *   EnsaioLaboratorial
    *   ResultadoEnsaio
    *   EspecificacaoParametro
*   Relações:
    *   EnsaioLaboratorial gera ResultadoEnsaio
    *   EspecificacaoParametro define limites para ResultadoEnsaio
*   Eventos críticos:
    *   Validação do ResultadoEnsaio
* * *

## 3\. QMS – Gestão da Qualidade

### US-QMS-001 – Registo de Não Conformidades

Como **Técnico de Qualidade**
Quero **registar e categorizar Não Conformidades oriundas de produção, laboratório e auditorias**
Para **acompanhar causas, impactos e eficácia das ações corretivas**

Critérios de Aceitação:
*   É possível criar NC com origem, tipo, gravidade, impacto e descrição.
*   NC pode ser ligada a lote, cliente, fornecedor ou auditoria.
*   O estado da NC (Aberta, Em Análise, Encerrada) é claramente visível.

Módulo: QMS
Normas relacionadas: ISO 9001, ISO 22000

ERD Mental (conceitual):
*   Entidades:
    *   NaoConformidade
    *   LoteProducao
    *   Auditoria
*   Relações:
    *   NaoConformidade pode referenciar um LoteProducao
    *   Auditoria pode originar NaoConformidade
*   Eventos críticos:
    *   Abertura de NaoConformidade
    *   Encerramento com CAPA implementada

### US-QMS-002 – Gestão de CAPA

Como **Responsável de Qualidade**
Quero **abrir, atribuir e acompanhar planos CAPA ligados a NC**
Para **garantir resolução estruturada de problemas e evidência em auditorias**

Critérios de Aceitação:
*   É possível criar uma ou mais CAPA para cada NC.
*   Cada CAPA possui responsável, prazo, ações definidas e evidências de conclusão.
*   Dashboards apresentam NC com CAPA atrasadas ou sem eficácia comprovada.

Módulo: QMS
Normas relacionadas: ISO 9001, ISO 22000

ERD Mental (conceitual):
*   Entidades:
    *   NaoConformidade
    *   CAPA
*   Relações:
    *   NaoConformidade gera uma ou mais CAPA
*   Eventos críticos:
    *   Criação de CAPA
    *   Encerramento de CAPA após verificação de eficácia
* * *

## 4\. FSMS – Segurança Alimentar / HACCP

### US-FSMS-001 – Manutenção de Plano HACCP

Como **Responsável de Segurança Alimentar**
Quero **modelar e manter planos HACCP por unidade, linha e produto**
Para **demonstrar a identificação sistemática de perigos, PCC e ações de controlo em auditorias**

Critérios de Aceitação:
*   É possível definir perigos, PCC, limites críticos, monitorização, ações corretivas e verificações.
*   O plano é versionado, com histórico de alterações.
*   Cada PCC está ligado a parâmetros concretos e a planos de amostragem/monitorização.

Módulo: FSMS
Normas relacionadas: ISO 22000, HACCP, BPF

ERD Mental (conceitual):
*   Entidades:
    *   PlanoHACCP
    *   PCC
    *   MonitorizacaoPCC
*   Relações:
    *   PlanoHACCP contém múltiplos PCC
    *   PCC é monitorizado via MonitorizacaoPCC
*   Eventos críticos:
    *   Aprovação de versão do PlanoHACCP
* * *

## 5\. Gestão de Materiais & Fornecedores

### US-MAT-001 – Avaliação de Fornecedores

Como **Responsável de Compras/Qualidade**
Quero **acompanhar o desempenho de fornecedores com base em NC, devoluções e resultados de recepção**
Para **suportar decisões de qualificação, desqualificação e planos de melhoria conjunta**

Critérios de Aceitação:
*   É possível ver, para cada fornecedor, histórico de NC, devoluções e rejeições na recepção.
*   Indicadores de desempenho (por exemplo % de lotes aprovados) são calculados por período.

Módulo: Materiais & Fornecedores
Normas relacionadas: ISO 9001, ISO 22000
* * *

## 6\. Engenharia de Produto

### US-ENG-001 – Gestão de Fichas Técnicas

Como **Engenheiro de Processo**
Quero **definir e versionar Fichas Técnicas de Produto**
Para **garantir que produção, laboratório e qualidade utilizam especificações alinhadas e atualizadas**

Critérios de Aceitação:
*   É possível criar fichas por produto, com especificações de qualidade e parâmetros de processo críticos.
*   Alterações são versionadas, com registo de quem alterou e porquê.

Módulo: Engenharia de Produto
Normas relacionadas: ISO 9001, ISO 22000
* * *

## 7\. Relatórios, BI, IA & SPC

### US-BI-001 – Relatórios de Auditoria

Como **Auditor Interno**
Quero **extrair relatórios consolidados de NC, CAPA, monitorização de PCC e resultados laboratoriais**
Para **avaliar a eficácia do sistema de gestão e preparar auditorias externas**

Critérios de Aceitação:
*   Existem relatórios pré-definidos com filtros por período, unidade, linha, produto e cliente.
*   Os relatórios podem ser exportados em formato adequado a auditorias (PDF/CSV).

Módulo: Relatórios & BI
Normas relacionadas: ISO 9001, ISO 22000, ISO 17025

### US-SPC-001 – Controlo Estatístico de Processo

Como **Engenheiro de Processo**
Quero **monitorizar parâmetros críticos através de gráficos de controlo SPC**
Para **detectar desvios de processo antes que se transformem em NC de produto**

Critérios de Aceitação:
*   É possível selecionar parâmetros críticos para SPC.
*   O sistema calcula e apresenta gráficos de controlo com limites calculados.
*   Alertas são gerados quando pontos saem dos limites ou padrões anómalos são detectados.

Módulo: IA & SPC
Normas relacionadas: Melhoria Contínua, ISO 9001