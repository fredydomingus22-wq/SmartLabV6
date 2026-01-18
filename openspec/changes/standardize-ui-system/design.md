# Design: UI Standardization Architecture

## 1. Component Strategy

### 1.1. Page Layout Wrappers
Criar/Refatorar o `PageShell` e `PageSection` para encapsular paddings e alinhamentos padrão.
- `PageShell`: Wrapper principal com `min-h-screen`, background correto e padding responsivo.
- `PageHeader`: Componente de topo fixo (se aplicável) ou stuck no scroll, contendo Título, Breadcrumb e Actions.

### 1.2. Card Architecture
Migrar todos os cards "hardcoded" para componentes primitivos estritos:
- `<KPICard />`: Aceita `title`, `value`, `trend`, `icon`. Enforce `h-[120px]`.
- `<ChartCard />`: Wrapper para Recharts com `CardHeader` standard.
- `<TableCard />`: Wrapper para DataTables com paginação e filtros integrados.

## 2. Navigation Architecture

### 2.1. Router-Level Grouping
A estrutura de pastas do Next.js App Router já suporta agrupamento, mas a Sidebar deve refletir isso visualmente.
- **Grupos**: "LIMS Core", "Production & MES", "Quality Hub (QMS)", "Food Safety (FSMS)", "Assets & Stocks".
- Cada grupo deve ser colapsável ou separado por divisores visuais claros.

### 3. Implementation Plan
1. **Phase 1**: Refatorar `app-sidebar.tsx` para consumir a nova estrutura agrupada.
2. **Phase 2**: Criar componentes wrappers (`@/components/defaults/`).
3. **Phase 3**: Migrar página a página (iniciando por QMS e LIMS).

## 4. Risks & Mitigations
- **Risco**: Quebrar layouts existentes durante a migração.
- **Mitigação**: Criar componentes novos em paralelo e substituir progressivamente.
