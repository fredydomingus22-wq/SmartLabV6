# 🎨 SmartLab – System Design (Figma-First Mandatory) & UI/UX Guidelines (Ultra Premium)

## 1. Objetivo

Este documento define as regras visuais e de experiência do utilizador (UI/UX) para o **SmartLab Enterprise**. Ele deve ser consultado por qualquer agente ou programador antes de criar, alterar ou otimizar qualquer interface do sistema.

O objetivo é posicionar o SmartLab no mesmo nível visual e funcional de plataformas premium como:

* Apple Industrial UI
* Tesla UI
* Siemens MindSphere
* PepsiCo KORE
* InfinityQS

---

## 2. Filosofia de Design

Princípios obrigatórios:

* **Industrial Futurista**
* **Dark-first**
* **Data-centric UI**
* **Zero clutter** (interfaces limpas, sem ruído)
* **Motion com propósito**
* **Design baseado em hierarquia visual clara**

> Regra de ouro: cada tela deve parecer desenhada no Figma por um designer sênior.

---

## 3. Paleta de Cores Oficial

Base:

* slate-950 (background primário)
* slate-900 (camadas)
* slate-800 (cards)
* slate-700 (linhas/bordas)

Texto:

* slate-100 (alto contraste)
* slate-400 (secundário)

Status:

* emerald → OK / aprovado
* amber → Alerta / Warning
* red → Crítico / OOS
* sky → Informação / neutro

Nunca utilizar cores fora desta paleta.

---

## 4. Tipografia

Hierarquia:

* Títulos: Extra Bold, tracking-tight
* Subtítulos: Medium
* Corpo de texto: Regular
* Labels técnicos: Uppercase, tracking-wide

Escalas recomendadas:

* H1: text-3xl
* H2: text-2xl
* H3: text-xl
* Corpo: text-sm / text-base

---

## 5. Layout System

Regras fixas:

* Sidebar fixa à esquerda
* Header superior sticky
* Conteúdo em grid responsivo

Breakpoints:

* Mobile: 1 coluna
* Tablet: 2 colunas
* Desktop: 3–4 colunas
* Wide: 6+ colunas (dashboards)

Espaçamento:

* Padding externo mínimo: p-6
* Gap entre cards: gap-4 ou gap-6

---

## 6. Design de Componentes

### Cards (Data Cards)

Devem conter:

* Título técnico
* Valor principal
* Delta/trend
* Micro descrição

### Tabelas

* Header sticky
* Alternância de linhas
* Realce de células críticas

### Inputs & Forms

* Labels claras
* Suporte a erro inline
* Estados de focus e hover fortes

---

## 7. Motion & Animações

Regras:

* Animações suaves
* Dados sempre priorizados sobre efeitos

Usos permitidos:

* Transições de página
* Hover states responsivos
* Skeleton loaders

---

## 8. Experiência do Usuário (UX)

Regras obrigatórias:

* Zero scroll desnecessário
* Navegação em até 2 cliques
* Feedback visual imediato

---

## 9. Responsividade Obrigatória

O sistema deve ser perfeito em:

* Tablets industriais
* Monitores 1080p
* Ultrawide
* Mobile para supervisores

---

## 10. Padrões de Dashboard (Referência)

Dashboards devem parecer com:

* Palantir Foundry
* Tesla Infotainment
* Apple Vision Pro UI

Incluir:

* KPIs
* SPC Charts
* Trend Charts
* Heatmaps

---

## 11. Uso Obrigatório

Qualquer modificação de UI deve:

* Ler este documento
* Validar o resultado contra estas regras
* Não quebrar consistência visual

---

## 12. Frase Final de Sistema

> "Toda interface do SmartLab deve parecer uma central de comando industrial de próxima geração."

## Design Tokens

* Use Figma tokens as the single source of truth.
* Define and sync: colors, typography, spacing, radii, shadows.
* Maintain token naming: `color.bg.primary`, `color.text.muted`, `space.2`, `radius.lg`.

## Responsive Grid System

* Use a 12-column grid for desktop, 8 for tablet, 4 for mobile.
* All layouts must be defined in Figma with constraints and auto-layout.
* Breakpoints: Mobile (<768px), Tablet (768–1024px), Desktop (>1024px).

## Dark/Light Themes

* Mandatory support for Dark and Light themes in Figma.
* All components must be designed first in Dark Mode, then adapted to Light.
* Contrast ratios must meet WCAG AA minimum.
