# Proposal: System-Wide UI/UX Standardization

## 1. Goal
Unificar a experiência visual e de navegação de todo o SmartLab Enterprise, eliminando inconsistências e implementando o padrão **shadcn/ui + Radix UI** de forma absoluta.

## 2. Why
Atualmente, existem divergências de layout entre módulos (ex: QMS vs Produção). Para escalar como um produto de classe mundial, precisamos de:
- Consistência visual (confiança do utilizador).
- Navegação previsível (curva de aprendizado reduzida).
- Manutenibilidade (componentes globais).

## 3. What Changes

### 3.1. Standard Page Layouts
- **PageHeader Global**: Todas as páginas devem usar o componente `PageHeader` com título, breadcrumbs e ações.
- **Tabbed Interfaces**: Rotas complexas (ex: `/quality/qms`) devem usar Tabs para navegação interna, evitando reloads desnecessários.
- **Container Alignment**: Todos os containers devem respeitar o grid de 4px e os tokens de espaçamento do `ui-standards.md`.

### 3.2. Sidebar & Navigation
- **Module Centric**: A navegação deve ser estritamente agrupada por módulo funcional (LIMS, QMS, MES, FSMS).
- **Iconografia**: Uniformização dos ícones (Lucide React) e estados ativos.

### 3.3. Card System
- **KPI Cards**: Altura fixa de `120px` para todos os cards de resumo.
- **Analytical Cards**: Altura padronizada para gráficos (`260px`).
- **Operational Cards**: Listas e tabelas com wrappers standard.

## 4. Success Criteria
- [ ] 100% das páginas usam `PageHeader`.
- [ ] Navegação lateral refatorada por módulos.
- [ ] Inexistência de estilos "ad-hoc" ou "magic numbers".
