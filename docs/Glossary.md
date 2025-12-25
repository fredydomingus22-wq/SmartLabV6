# **12 – Glossary.md**

### *Glossário Oficial – SmartLab Enterprise*

Este glossário reúne todos os termos técnicos, de qualidade, segurança alimentar, estatística, IA e arquitetura usados no SmartLab Enterprise.

Organizado por categorias para facilitar auditorias, onboarding e desenvolvimento.

---

# **A. Qualidade & Controlo de Processo**

### **Amostra (Sample)**

Unidade de produto, matéria-prima ou processo coletada para teste.

### **Análise (Analysis)**

Resultado obtido a partir de uma amostra, geralmente medindo um parâmetro.

### **Parâmetro (Parameter)**

Variável medida em um produto (ex.: Brix, pH, CO₂, acidez).

### **Especificação (Spec)**

Limites definidos: **mínimo, máximo e alvo (target)**.

### **Lote Pai (Production Lot)**

Lote principal que inicia uma produção e gera produtos intermédios e finais.

### **Produto Intermédio (Intermediate Lot)**

Xarope/mistura produzido antes do produto final.

### **Produto Final (Finished Lot)**

Produto pronto para consumo, analisado antes da liberação.

### **RFT – Right First Time**

Percentagem de análises que ficam conformes na primeira tentativa.

### **OOS – Out of Specification**

Resultado fora da especificação definida.

### **OOT – Out of Trend**

Resultado dentro da especificação, mas fora do comportamento normal da tendência.

### **SPC – Statistical Process Control**

Ferramentas estatísticas para monitorar processo.

### **Cp / Cpk / Pp / Ppk**

Indicadores de capacidade do processo.

### **NC – Não Conformidade**

Registro de falha, desvio ou evento inesperado.

### **8D**

Metodologia de resolução de problemas em 8 passos.

---

# **B. Segurança Alimentar (Food Safety)**

### **PRP – Programa de Pré-Requisitos**

Fundamentos básicos de higiene, limpeza, pragas, estrutura, etc.

### **OPRP – Programa Operacional de Pré-Requisito**

Controlo específico mais crítico que PRP, mas menos crítico que PCC.

### **PCC – Ponto Crítico de Controlo**

Etapa que, se não for controlada, pode levar a risco à segurança alimentar.

### **Planilha HACCP**

Documento onde constam perigos, medidas de controle, limites críticos e verificações.

### **Desvio de PCC**

Resultado fora do limite crítico definido.

---

# **C. Laboratório & Metrologia**

### **Reagente**

Substância usada para testes laboratoriais.

### **Validade do Reagente**

Prazo em que o reagente mantém integridade.

### **Calibração**

Ajuste e certificação de instrumentos para garantir medição correta.

### **Certificado de Calibração**

Documento oficial obtido após calibração.

### **Equipamento Crítico**

Equipamento cujo erro impacta diretamente a qualidade.

### **Método Analítico**

Procedimento técnico que define como medir um parâmetro.

---

# **D. IA & Data Analytics**

### **IA Preditiva**

Modelos que antecipam desvios antes de ocorrerem.

### **Anomalia**

Comportamento inesperado detectado nos dados.

### **Trend Analysis**

Avaliação da tendência do processo.

### **Auto-NC**

NC gerada automaticamente pelo motor de IA.

### **Explainability**

Justificativa gerada pela IA para explicar o desvio.

### **Feature Store**

Repositório central de variáveis/modelos para IA.

### **Análise Multivariada**

Correlação de várias variáveis ao mesmo tempo.

---

# **E. Arquitetura do Sistema**

### **Organization (Tenant)**
 
Entidade de topo (Grupo Empresarial) que isola os dados.
 
### **Multi-tenant**
 
Várias Organizations usam a mesma plataforma isoladamente.

### **Spec Engine**

Módulo que aplica automaticamente limites e especificações.

### **Sampling Engine**

Motor que controla frequência de análise, plano de coleta e horários.

### **Form Builder**

Ferramenta que permite criar formulários dinâmicos.

### **Traceability Engine**

Sistema que liga matéria-prima → lote pai → xarope → produto final → análises → NC.

### **RBAC – Role-Based Access Control**

Controlo de acesso por função (admin, QA, técnico, auditor).

### **API Layer**

Camada de comunicação com sistemas externos.

---

# **F. Fornecedores & Materiais**

### **COA – Certificate of Analysis**

Documento com resultados enviados pelo fornecedor.

### **Avaliação de Fornecedor**

Score de risco baseado em performance e histórico.

### **Quarentena**

Estado em que material não pode ser usado antes de ser analisado.

### **Material de Embalagem**

Garrafas, tampas, rótulos, preformas, caixas etc.

---

# **G. Auditorias & Documentação**

### **Auditoria Interna**

Revisão conduzida pela própria organização.

### **Auditoria Externa**

Revisão conduzida por certificadora ou cliente.

### **Evidência**

Prova objetiva: fotos, análises, documentos, registros.

### **Checklist Auditável**

Lista de verificação com rastreabilidade.

---

# **H. Normas & Certificações**

### **FSSC 22000**

Norma global de segurança alimentar.

### **ISO 9001**

Norma de gestão da qualidade.

### **ISO 22000**

Norma de sistemas de segurança alimentar.

### **HACCP**

Metodologia de controlo de perigos.

### **ISO 17025**

Norma para laboratórios e calibração.

### **GMP – Good Manufacturing Practices**

Boas práticas de manufatura.

---

# **I. Termos de UI/UX e Operação**

### **Dashboard**

Tela de indicadores.

### **Pipeline**

Fluxo visual de estados.

### **Card**

Componente UI para mostrar métricas.

### **Heatmap**

Mapa visual de cores mostrando intensidade de valores.

### **Drilldown**

Ação de clicar num dado e ver mais detalhes.

---

# **Documento finalizado**
