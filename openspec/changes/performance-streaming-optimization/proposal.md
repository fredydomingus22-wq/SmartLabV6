# OpenSpec Change Proposal: Industrial Performance & Instant-Load Architecture

## 🚀 Mission
Eliminar a percepção de latência no SmartLab, transformando a navegação em uma experiência instantânea ("SPA-like") e otimizada para conexões industriais instáveis.

## ⚠️ Problem Statement
Atualmente, as páginas core (Laboratório, Relatórios) utilizam `force-dynamic` com fetches síncronos no servidor. Isso causa:
1.  **Blocking Navigation**: O utilizador clica e o sistema "congela" enquanto aguarda a resposta do Supabase no servidor.
2.  **Redundant Rendering**: Componentes estáticos como Sidebar e Header são re-calculados em cada navegação.
3.  **Low Tolerance to Latency**: Em redes industriais lentas, a aplicação torna-se inutilizável devido ao tempo de espera do TTFB (Time to First Byte).

## 🧬 Proposed Solution (Architectural)

### 1. Hybrid Hydration Strategy (TanStack Query v5)
Mover a responsabilidade do estado de dados do Servidor para o Cliente, utilizando o TanStack Query para orquestrar o ciclo de vida dos dados.
- **Server**: Prefetch apenas dos dados críticos (Identidade, Contexto do Cliente).
- **Client**: Fetch e Caching dos dados de negócio (Amostras, KPIs).

### 2. Implementation of "Persistent Shell"
Garantir que os Layouts do Next.js não re-renderizem desnecessariamente, mantendo a Sidebar e Header estáticos enquanto o conteúdo interno faz streaming.

### 3. Progressive Loading (Streaming & Skeletons)
Utilizar `Suspense` real. Retornar o cabeçalho da página imediatamente e carregar os dados em blocos (KPIs -> Listas -> Detalhes).

## 🛠️ Infrastructure Changes

### Query Client Provider
Implementar um `providers/query-provider.tsx` global para gerir o cache.

### Service Refactoring (Dev Audit)
Converter queries estáticas do Supabase em Server Actions otimizadas ou Client-side fetches com `select()` fields limitados.

## ✅ Acceptance Criteria (QA)
- [ ] Navegação entre Dashboard e Lab deve ocorrer abaixo de 100ms (Shell load).
- [ ] Dados já consultados devem aparecer instantaneamente (Cache HIT).
- [ ] Skeletons premium devem ser exibidos durante o carregamento inicial.
- [ ] O sistema deve ser utilizável em conexões "Slow 3G" simuladas.

---
**Change ID**: `performance-streaming-optimization`
**Status**: `DRAFT`
**Lead Specialist**: Architect
