# SmartLab Enterprise – System Foundation

* * *
## **1\. Introdução e Visão do Produto**
O SmartLab Enterprise é um ecossistema digital integrado concebido para indústrias de alimentos e bebidas, com foco inicial em Angola e África, cujo objetivo central é alinhar **Qualidade, Produção, Laboratório e Segurança Alimentar** numa única plataforma operacional. O sistema foi projetado para suportar organizações que precisam elevar a maturidade de gestão da qualidade e da segurança alimentar, garantindo conformidade com **ISO 9001**, **ISO 22000**, **ISO 17025** e princípios de **HACCP** e **BPF**, mesmo em contextos de infraestrutura limitada e baixa maturidade digital.
A visão do SmartLab Enterprise é estabelecer uma **camada digital única de verdade** para dados de qualidade, produção, laboratório e segurança alimentar, permitindo que decisões críticas – como liberação de lotes, bloqueio de produção, gestão de não conformidades e ações corretivas – sejam tomadas com base em dados rastreáveis, auditáveis e consistentes com requisitos normativos e regulatórios.
Do ponto de vista de engenharia de software, o SmartLab Enterprise é construído sobre uma arquitetura moderna baseada em **Next.js + TypeScript** no frontend, **Supabase** como backend e base de dados, e **serviços especializados em Python** para SPC, IA, automação de decisões e analytics. Essa arquitetura permite evolução incremental, multitenancy nativo e integração progressiva com sistemas legados de ERP, automação de chão de fábrica e dispositivos laboratoriais, sem exigir, na fase inicial, investimentos pesados em IoT.
## **2\. Contexto Industrial – Alimentos & Bebidas em Angola e África**
As indústrias de alimentos e bebidas em Angola e em diversos países africanos enfrentam simultaneamente:
*   **Pressão regulatória crescente** para adoção de sistemas de gestão da qualidade e da segurança alimentar alinhados a ISO 9001, ISO 22000, HACCP, ISO 17025 e requisitos locais.
*   **Infraestrutura tecnológica limitada**, com conectividade instável, baixo nível de automação e forte dependência de registos em papel ou planilhas dispersas.
*   **Equipes operacionais e de qualidade sobrecarregadas**, que precisam garantir conformidade documental, rastreabilidade de lotes e preparação para auditorias, sem dispor de ferramentas integradas.
*   **Dificuldade em consolidar dados industriais**, tornando lenta a análise de causas de não conformidades, o acompanhamento de planos de ação (CAPA) e a avaliação de desempenho de fornecedores, linhas de produção e laboratórios.
Neste contexto, soluções complexas e fortemente dependentes de hardware sofisticado não são sustentáveis. O SmartLab Enterprise parte de um princípio de **digitalização pragmática**, priorizando:
*   Fluxos de trabalho digitais que possam ser executados em computadores padrão ou tablets simples.
*   Interfaces otimizadas para operadores, analistas de laboratório, técnicos de qualidade e gestores, com foco na redução de erros de registo e no aumento da rastreabilidade.
*   Estrutura de dados preparada para futura integração com sensores, PLCs, SCADAs e instrumentos laboratoriais, sem exigir que estes estejam presentes desde o primeiro momento.
## Arquitetura técnica para desenvolvimento
Esta secção reúne as páginas técnicas que o programador deve usar como referência direta para modelar a base de dados (Supabase/PostgreSQL), DTOs TypeScript e contratos entre backend (NestJS) e frontend (React).
### Páginas técnicas principais
1. **Núcleo físico MES/LIMS/QMS/FSMS (Supabase)**

  

URL: Private ([https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1072](https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1072))

  

Foca o modelo físico central (tabelas transversais, lotes, ordens, amostras, resultados, NC, CAPA, HACCP, etc.), incluindo:
*   convenções de PK/FK, `tenant_id`, colunas de audit trail e RLS;
*   estados explícitos para entidades críticas (lotes, amostras, resultados, NC/CAPA);
*   integração conceptual com o motor de decisão BL‑01…BL‑04.

2. **Esquema físico global por contexto (Supabase)**

  

URL: Private ([https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1092](https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1092))

  

Organiza o modelo físico por contexto de negócio (Produção/MES, LIMS+Metrologia, QMS/FSMS, Materiais & Fornecedores, Engenharia de Produto, Segurança & Acesso), incluindo:
*   visão de quais tabelas vivem em cada contexto;
*   chaves de integração entre contextos;
*   notas de invariantes (bloqueio de lotes, segregação de funções, etc.).

3. **Metrologia & equipamentos de laboratório (ISO 17025)**

  

URL: Private ([https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1112](https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1112))

  

Detalha o modelo para metrologia e rastreabilidade ISO 17025, incluindo:
*   `equipamento_laboratorio`, `certificado_calibracao`, `intervencao_manutencao`;
*   estados metrológicos (APTO, REPROVADO, FORA\_DE\_SERVICO, etc.);
*   integração com ensaios laboratoriais, resultados e NC de origem metrologia.

4. **Equipamentos de processo, CIPs & estados de higiene**

  

URL: Private ([https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1052](https://app.clickup.com/90121432851/docs/2kxufvrk-752/2kxufvrk-1052))

  

Modela equipamentos de processo, circuitos CIP e estados de higiene, incluindo:
*   `equipamento_processo`, `circuito_cip`, `ponto_higiene`, `execucao_cip`, `parametro_cip_medido`;
*   estados de higiene (`LIBERADO_USO`, `REQUER_CIP`, `EM_CIP`, `BLOQUEADO_POR_CIP_REPROVADO`);
*   regras de bloqueio/liberação de equipamentos e impacto sobre lotes, PCCs e NC.

### Como o programador deve usar esta secção
*   Começar sempre por este documento **System Foundation** para entender o "porquê" (visão e princípios).
*   Em seguida, abrir as páginas técnicas acima para o "como" (tabelas concretas, estados, contratos TS).
*   Gerar o DDL de Supabase e os tipos/DTOs TS diretamente a partir dessas páginas, mantendo as invariantes e estados tal como definidos.
## **3\. Princípio Quality-First by Design**
O SmartLab Enterprise é concebido explicitamente sob o princípio **Quality-First by Design**, significando que:
*   As decisões de **liberação, bloqueio e segregação de produto** são ancoradas em dados de qualidade, resultados laboratoriais e análises de risco de segurança alimentar, não apenas em metas de volume de produção.
*   Cada fluxo de trabalho crítico de produção possui **pontos de controlo de qualidade claramente definidos**, com possibilidade de registo de resultados, desvios, não conformidades e ações corretivas.
*   O sistema provê **evidência objetiva** de que a organização cumpre os requisitos de:
    *   ISO 9001 (gestão da qualidade, controle de documentos, registos, tratamento de NC, ações corretivas e melhoria contínua),
    *   ISO 22000 e HACCP (análise de perigos, determinação de PCC/PC, monitorização, ações corretivas, verificação, validação),
    *   ISO 17025 (competência laboratorial, rastreabilidade metrológica, validação de métodos, registos de resultados, incerteza de medição).
*   As funcionalidades são avaliadas em termos de **capacidade de suportar auditorias internas e externas**, garantindo trilhas de auditoria (quem fez o quê, quando, em que lote, com que resultado, sob que plano de amostragem).
Esse princípio orienta a priorização de funcionalidades e a própria arquitetura de dados: as entidades relacionadas à qualidade (não conformidades, planos CAPA, resultados laboratoriais, desvios de PCC, planos HACCP, especificações de produto) não são anexos periféricos, mas sim **nós centrais** do modelo de informação.
## **4\. Objetivos Estratégicos do Sistema**
Os objetivos estratégicos do SmartLab Enterprise podem ser sintetizados em quatro eixos principais:
*   **Elevar a capacidade de conformidade e auditoria**
    *   Garantir que todos os registos críticos (produção, qualidade, laboratório, segurança alimentar) sejam **localizáveis, íntegros, completos e rastreáveis**.
    *   Disponibilizar relatórios e trilhas de auditoria que demonstrem conformidade com ISO 9001, ISO 22000, HACCP e ISO 17025.
*   **Reduzir o custo da não qualidade e das falhas de segurança alimentar**
    *   Diminuir a frequência e severidade de **não conformidades internas e externas**, recalls e bloqueios de lote não planejados.
    *   Encurtar o ciclo de identificação → análise de causa → ação corretiva/preventiva → verificação de eficácia.
*   **Aumentar a produtividade operacional com controle de risco**
    *   Reduzir o tempo gasto em registos manuais redundantes, consolidação de dados e preparação para auditorias.
    *   Aumentar a visibilidade em tempo quase real dos estados de linha, lotes, ordens de produção, resultados de análises e desvios.
*   **Preparar a indústria para evolução digital incremental**
    *   Estabelecer uma base de dados e processos digitais que permitam, no futuro, a integração natural com:
        *   Dispositivos IoT e sensores industriais.
        *   Sistemas de planejamento de produção (ERP/MES externos).
        *   Ferramentas avançadas de IA para predição de falhas, otimização de parâmetros de processo e SPC.
## **5\. Escopo Funcional do SmartLab Enterprise**
O escopo funcional do sistema é organizado em módulos integrados, cada um com objetivos específicos, mas todos partilhando um modelo de dados coerente e orientado à rastreabilidade.
### **5.1 MES – Manufacturing Execution System**
*   Gestão de ordens de produção, lotes e campanhas.
*   Registo de produção por linha, turno, equipamento e produto.
*   Registo de paragens, motivos de paragem e impactos em OEE.
*   Integração com pontos de controlo de qualidade em processo (amostragens, medições críticas, PCCs).
*   Registo de bloqueios de lote originados por desvios de qualidade ou segurança alimentar.
Alinhamento normativo: suporte indireto a **ISO 9001** (controlo de produção, registos) e **ISO 22000/HACCP** (monitorização de PCC e PC, ações corretivas, rastreabilidade de lotes).
### **5.2 LIMS – Laboratory Information Management System**
*   Registo de amostras (matérias-primas, produto em processo, produto acabado, ambiente, água, superfícies).
*   Planeamento de ensaios microbiológicos e físico-químicos.
*   Registo de resultados, limites de especificação, aceitação/reprovação.
*   Rastreabilidade por lote, fornecedor, linha, turno, data e analista.
*   Suporte a requisitos de **ISO 17025**: rastreabilidade metrológica, calibração, validação de métodos, registo de incerteza e não conformidades laboratoriais.
### **5.3 QMS – Quality Management System**
*   Gestão de não conformidades (internas, de fornecedor, de cliente) com classificação por severidade, origem e impacto.
*   Gestão de ações corretivas e preventivas (CAPA) com definição de responsáveis, prazos, etapas e verificação de eficácia.
*   Gestão de auditorias internas, externas e de fornecedores.
*   Gestão documental de procedimentos, instruções de trabalho, formulários e registos controlados.
Alinhamento normativo: **ISO 9001**, **ISO 22000**, **ISO 17025**, com enlaces diretos a HACCP em desvios de PCC, planos de amostragem e registros críticos.
### **5.4 FSMS – Food Safety Management System**
*   Modelação e manutenção de planos HACCP (produtos, linhas, processos, PCC, PC, perigos, medidas de controlo).
*   Registo e monitorização de PCC/PC com limites críticos, limites de alerta e ações corretivas.
*   Gestão de pré-requisitos e BPF (higiene, pragas, água, resíduos, manutenção, formação, etc.).
*   Integração direta com QMS para abertura de NC e CAPA em desvios de segurança alimentar.
Alinhamento normativo: **ISO 22000**, **HACCP**, requisitos de BPF, regulamentos locais de segurança alimentar.
### **5.5 Gestão de Materiais e Fornecedores**
*   Registo de matérias-primas, materiais de embalagem, insumos auxiliares.
*   Gestão de especificações de materiais, requisitos de certificação e documentação associada.
*   Avaliação de desempenho de fornecedores com base em NC, desvios, ensaios de receção e cumprimento de requisitos documentais.
### **5.6 Engenharia de Produto**
*   Gestão de fichas técnicas e especificações de produto.
*   Parametrização de planos de controlo (em processo, produto acabado, ambiental).
*   Gestão de versões de produto e histórico de alterações.
### **5.7 Relatórios & BI**
*   Dashboards operacionais para produção, qualidade, laboratório e segurança alimentar.
*   Relatórios de NC, CAPA, desempenho de fornecedores, cumprimento de planos de amostragem.
*   Relatórios específicos de auditoria (por norma, por processo, por unidade industrial).
### **5.8 IA & SPC**
*   Cálculo de indicadores estatísticos de processo (médias, desvios, Cp, Cpk, cartas de controlo), suportando SPC.
*   Módulos de apoio à decisão para priorização de ações corretivas, identificação de causas prováveis e previsão de risco de NC.
*   Modelos de recomendação de parâmetros de processo (dentro de faixas validadas) para redução de variabilidade.
## **6\. Arquitetura Conceitual do Ecossistema**
A arquitetura conceitual do SmartLab Enterprise organiza o ecossistema em **camadas funcionais** e **módulos de domínio**:
*   **Camada de Domínio Industrial**
    *   Entidades principais: Lote, Ordem de Produção, Linha, Equipamento, Produto, Amostra, Ensaio, Resultado, NC, CAPA, Plano HACCP, PCC/PC, Fornecedor, Material, Documento Controlado.
    *   Regras de negócio orientadas a qualidade e segurança alimentar (por exemplo, liberação condicionada a resultados laboratoriais e verificação de PCC).
*   **Camada de Aplicação (Módulos MES, LIMS, QMS, FSMS, Materiais, Engenharia de Produto, Relatórios, IA/SPC)**
    *   Implementa fluxos de trabalho específicos, reutilizando entidades comuns.
    *   Garante consistência de estados (por exemplo, um Lote não pode estar simultaneamente “Bloqueado por NC” e “Liberado”).
*   **Camada de Integração e Serviços Comuns**
    *   Autenticação, autorização e gestão de perfis.
    *   Audit trail centralizado (registo de ações de utilizador e eventos de sistema).
    *   Serviços de notificação e escalonamento (e-mail, alertas internos).
    *   Conectores para ERP, sistemas legados e, futuramente, dispositivos IoT e instrumentos laboratoriais.
*   **Camada de Apresentação (Frontend)**
    *   Interfaces otimizadas por perfil: Operador de Produção, Analista de Laboratório, Técnico de Qualidade, Responsável de Segurança Alimentar, Gestor Industrial, Auditor.
    *   Foco em minimizar cliques, reduzir erro humano e tornar visível o estado de conformidade em cada etapa.
Esta arquitetura conceitual garante que, em auditoria, seja possível demonstrar:
*   Como os dados fluem desde o registo de produção e amostras até relatórios de NC e CAPA.
*   Como decisões de liberação/bloqueio são suportadas por evidência documentada.
*   Como a integridade dos registos é preservada (audit trail, controlo de acessos, integrações controladas).
## **7\. Integração MES, QMS, FSMS e LIMS**
A força do SmartLab Enterprise está na **integração nativa** dos quatro pilares principais:
*   O **MES** regista ordens, lotes, produção e paragens.
*   O **LIMS** regista amostras e resultados laboratoriais associados a lotes, fornecedores, linhas e ambientes.
*   O **QMS** regista NC, CAPA, auditorias e gestão documental.
*   O **FSMS** (HACCP/BPF) estrutura planos de segurança alimentar e controlo de PCC/PC.
Integrações chave:
*   **Do FSMS/QMS para o MES**
    *   Desvios em PCC/PC ou BPF (FSMS) podem gerar automaticamente NC (QMS) e, quando aplicável, bloquear lotes e ordens de produção no MES.
*   **Do LIMS para o MES/QMS/FSMS**
    *   Resultados laboratoriais fora de especificação, em qualquer ponto do plano de controlo, podem:
        *   Bloquear ou segregar lotes no MES.
        *   Abrir NC no QMS.
        *   Sinalizar desvios de plano HACCP no FSMS.
*   **Do QMS para todos os módulos**
    *   Ações corretivas relacionadas a causas de processo ou de fornecedor podem originar mudanças em planos de amostragem (LIMS), planos HACCP (FSMS) ou parâmetros de processo (MES).
Esta integração é documentada de forma que um auditor consiga seguir, com clareza, o encadeamento: **evento → registo → análise → ação → verificação de eficácia**.
## **8\. Multitenancy desde a Origem**
O SmartLab Enterprise é projetado como uma plataforma **multi-inquilino (multitenant)**, permitindo que múltiplas unidades industriais, plantas ou mesmo empresas distintas sejam servidas pela mesma infraestrutura lógica, mantendo **isolamento rigoroso de dados e configurações**.
Aspectos fundamentais de multitenancy no contexto deste documento:
*   **Isolamento lógico de dados por tenant**: cada organização/cliente possui o seu próprio espaço de dados, sem possibilidade de acesso cruzado entre tenants.
*   **Configurações parametrizáveis por tenant**: planos HACCP, especificações de produto, planos de amostragem, fluxos de aprovação, perfis de utilizador e políticas de acesso são configuráveis por organização.
*   **Modelo de dados preparado para expansão**: novas plantas, linhas ou laboratórios podem ser adicionados sem reestruturação profunda da base de dados.
*   **Suporte a requisitos regulatórios específicos por país/região**, permitindo que uma mesma plataforma atenda diferentes reguladores, mantendo lógica de negócio compartilhada onde fizer sentido.
Do ponto de vista de auditoria, a documentação de multitenancy deve explicitar como o sistema garante que:
*   Dados de clientes distintos não se misturam.
*   Perfis de acesso respeitam segregação de funções (por exemplo, quem pode aprovar NC, alterar planos HACCP, liberar lotes).
*   Logs de auditoria preservam a identificação inequívoca de tenant, utilizador e contexto.
## **9\. Benefícios para Produção, Qualidade e Auditoria**
### **9.1 Benefícios para Produção**
*   Redução de paragens e retrabalho decorrentes de **falta de informação em tempo útil** sobre qualidade e segurança alimentar.
*   Visibilidade consolidada de ordens, estados de lote, bloqueios e liberações.
*   Melhoria da comunicação entre turno, laboratório e qualidade, reduzindo conflitos entre metas de volume e requisitos de conformidade.
### **9.2 Benefícios para Qualidade e Segurança Alimentar**
*   Consolidação de NC, CAPA, planos HACCP, BPF, resultados laboratoriais e registos de produção numa única plataforma.
*   Trajetória clara de cada desvio, desde a deteção até a verificação de eficácia das ações.
*   Preparação simplificada para auditorias ISO 9001, ISO 22000, ISO 17025 e avaliações HACCP, com geração mais rápida de evidências.
### **9.3 Benefícios para Auditorias Internas e Externas**
*   Disponibilidade de **relatórios padronizados por norma, por processo e por unidade industrial**.
*   Facilitação do trabalho de auditores, que podem navegar por trilhas consistentes de eventos, registos e decisões.
*   Redução do risco de não conformidades maiores relacionadas a falhas de registo, documentação insuficiente ou incoerências entre áreas.