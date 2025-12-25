# UI Architecture & Installation Guide

> **Documento**: `docs/ui/00-ui-installation-guide.md`
> **Versão**: 1.0.0
> **Status**: Living Document

Este guia define a arquitetura de **Frontend & UI** do SmartLab Enterprise. Ele é a fonte de verdade para instalação de dependências, criação de componentes e padrões de UX/UI.

---

## 0) TL;DR (1 minuto)

Para garantir consistência e qualidade, utilizamos **Next.js 16 + shadcn/ui + Tailwind CSS**.

### O que instalar (Frontend Core)
```bash
# Core & Utils
npm install class-variance-authority clsx tailwind-merge lucide-react date-fns

# UI & Interactions
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu cmdk sonner nuqs

# Forms & Data
npm install react-hook-form @hookform/resolvers zod @tanstack/react-table

# Visualizations
npm install recharts
```

### O que usar para quê?
| Funcionalidade | Biblioteca Padrão | Justificativa |
| :--- | :--- | :--- |
| **Componentes Base** | **shadcn/ui** | Acessível, copy-paste, headless base (Radix UI). |
| **Estilização** | **Tailwind CSS** | Velocity, consistência via tokens. |
| **Forms Complexos** | **React Hook Form + Zod** | Performance (uncontrolled), validação robusta. |
| **Tabelas (Data)** | **TanStack Table (React Table)** | Headless, sorting/filtering, virtualização ready. |
| **Gráficos** | **Recharts** | Composable, leve, SVG-based. |
| **Toasts** | **Sonner** | Melhor UX, stackable, bonito por padrão. |
| **URL State** | **nuqs** | Type-safe search params para filtros. |

---

## 1) UI Stack Overview

A stack foi escolhida priorizando **estabilidade, acessibilidade e developer experience**.

*   **Framework**: Next.js 16 (App Router)
*   **Design System**: Shadcn/ui (Radix UI Primitives)
*   **Styling**: Discordância zero via `tailwind.config.ts`.
*   **Icons**: `lucide-react` (consistência de traço).
*   **Fonts**: `Inter` (padrão) ou `Geist Sans` (Next.js default).
*   **Temas**: Suporte a Dark Mode via `next-themes`.

### Configuração Core (`components.json`)
```json
{
  "style": "default",
  "rsc": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

---

## 2) Component Inventory por Módulo

Mapeamento de necessidades funcionais para componentes de UI.

| Módulo | Componentes Chave Necessários | Observações |
| :--- | :--- | :--- |
| **Dashboard** | `StatCard` (KPI), `OverviewChart` (Bar/Area), `RecentActivity` (List) | KPIs devem suportar loading state (Skeleton). |
| **LIMS (Lab)** | `SampleWizard` (Stepper), `ResultInput` (Validation), `BarcodePrinter` | Inputs com unidades (mg/L). Validação imediata. |
| **Produção** | `BatchStatusBadge`, `TankVisualizer` (SVG Custom), `ExecutionLog` | Timeline visual para acompanhar lotes. |
| **Estoque** | `DataTable` (Search/Sort), `LowStockAlert` (Banner), `ExpiryDatePick` | Filtros avançados por validade. |
| **Microbio** | `IncubatorGrid`, `PlateCountInput`, `DurationTimer` | Visualização de grid para incubadoras. |
| **Qualidade (SPC)** | `ControlChart` (X-bar/R), `Heatmap`, `DrillDownTable` | Gráficos complexos com linhas de limite (UCL/LCL). |
| **Admin** | `UserEdictDialog`, `PermissionMatrix` (Checkbox Grid), `AuditList` | Tabela de logs imutável. |

---

## 3) Dependências Recomendadas

### 3.1 Forms: React Hook Form + Zod
*   **Por que**: O padrão de mercado. Zod permite compartilhar schemas de validação entre Frontend e Backend (Server Actions).
*   **Alternativa rejeitada**: Formik (legado, bundle maior), TanStack Form (ainda muito novo/complexo para forms simples).

### 3.2 Tabelas: TanStack Table v8
*   **Por que**: Headless. Nós controlamos o HTML/CSS (shadcn), a lib controla a lógica complexa (sort multi-coluna, filtros globais, paginação server-side).
*   **Risco**: Curva de aprendizado maior que tabelas prontas.
*   **Mitigação**: Criar um wrapper `components/smart/data-table.tsx` para uso comum.

### 3.3 Charts: Recharts
*   **Por que**: Construído para React. Fácil de customizar eixos e tooltips, essencial para gráficos científicos (SPC).
*   **Alternativa rejeitada**: Chart.js (canvas-based, difícil de estilizar responsivamente com Tailwind), ECharts (muito pesado se não tree-shaken corretamente).

---

## 4) Guia de Instalação (Passo a Passo)

Siga esta ordem para configurar um ambiente novo ou atualizar o existente.

### Passo 1: Setup Inicial (se repo vazio)
```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint
npx shadcn@latest init
```

### Passo 2: Instalar Componentes Base (Shadcn)
Instale o essencial para começar. Não instale tudo de uma vez.
```bash
npx shadcn@latest add button card input label select dropdown-menu table dialog toast avatar badge calendar popover
```

### Passo 3: Configurar Libs de UI
Garanta que as libs de lógica estão presentes:
```bash
npm install react-hook-form @hookform/resolvers zod @tanstack/react-table lucide-react date-fns sonner rechart nuqs
```

---

## 5) Convenções de Componentes

### Estrutura de Pastas
```
src/
└── components/
    ├── ui/               # Componentes burros (shadcn originais). NÃO ALTERE LOGICA AQUI.
    │   ├── button.tsx
    │   └── table.tsx
    ├── smart/            # (Opcional) Wrappers com lógica de negócio ou composição.
    │   ├── data-table.tsx
    │   └── stat-card.tsx
    └── features/         # Componentes específicos de domínio (Modules)
        ├── lab/
        │   ├── sample-form.tsx
        │   └── result-input.tsx
        └── production/
            └── tank-card.tsx
```

### Padrões de Código
*   **Naming**: `PascalCase` para componentes (`Button.tsx`), `kebab-case` para arquivos (`button.tsx`).
*   **Imports**: Use alias `@/components/ui/button`.
*   **Composition**: Prefira composição a prop drilling.
    *   *Ruim*: `<Card title="X" content="Y" footer="Z" />`
    *   *Bom*: `<Card><CardHeader>...</CardHeader><CardContent>...</CardContent></Card>`

---

## 6) Padrões para Forms Complexos

1.  **Defina o Schema Zod** em arquivo separado (ex: `schemas/lab-sample.ts`) para reuso no Server Action.
2.  **Use `useForm`** com `zodResolver`.
3.  **Use `Form` (shadcn)** wrapper para acessibilidade automática (labels, aira-invalid, error messages).

#### Exemplo de campo com unidade:
```tsx
<FormField
  control={form.control}
  name="result"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Resultado ({unit})</FormLabel>
      <FormControl>
        <div className="flex gap-2">
           <Input {...field} type="number" step="0.01" />
           <span className="text-muted-foreground">{unit}</span>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 7) Padrões para Data Tables (Relatórios)

Use nosso wrapper `components/smart/data-table.tsx` que deve implementar `@tanstack/react-table`.

*   **Server-Side Pagination**: A tabela deve receber `data`, `pageCount` e `onPaginationChange`.
*   **Filters**: Use `nuqs` para sincronizar filtros com a URL (bom para DX - compartilhar link com filtro aplicado).
*   **Empty State**: Sempre renderize um estado vazio amigável quando `data.length === 0`.

---

## 8) Padrões para Charts Avançados (SPC)

Para gráficos de Controle de Qualidade (SPC), use `Recharts` com `ComposedChart`.

*   **Linhas de Limite**: Use `<ReferenceLine y={ucl} stroke="red" label="UCL" />` para limites de controle.
*   **Responsividade**: Sempre envolva o gráfico em `<ResponsiveContainer width="100%" height={350}>`.
*   **Tooltips**: Customize o `Tooltip` para mostrar datas formatadas e valores com precisão correta.

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
     <CartesianGrid strokeDasharray="3 3" />
     <XAxis dataKey="batchId" />
     <YAxis domain={['auto', 'auto']} />
     <Tooltip content={<CustomTooltip />} />
     <ReferenceLine y={10.5} stroke="red" strokeDasharray="3 3" />
     <Line type="monotone" dataKey="ph" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

---

## 9) Checklist de Qualidade (Pré-Merge)

Antes de abrir PR de UI:

- [ ] **Acessibilidade**: Consigo navegar no form via `Tab`? O foco está visível?
- [ ] **Mobile**: A tabela quebra no celular? (Use `overflow-x-auto` ou card view em mobile).
- [ ] **Loading States**: Adicionei `Skeleton` enquanto carrega dados?
- [ ] **Erro**: Se a API falhar, o usuário vê um Toast ou Alert? (Não deixe a tela branca).
- [ ] **Console**: Sem erros de `unique key` ou `hydration mismatch`.

---

## 10) How to Add a New UI Component

1.  **Verifique**: O componente já existe na biblioteca Shadcn? (`npx shadcn@latest add nome`).
2.  **Instale**: Se sim, adicione. Se não, procure no Radix UI ou crie manualmente em `components/ui`.
3.  **Adapte**: Ajuste cores e bordas em `src/app/globals.css` ou `tailwind.config.ts` se necessário (evite!).
4.  **Exporte**: Garanta que o componente está limpo e tipado.
5.  **Documente**: Se for complexo, adicione um comentário de uso no topo do arquivo.

---

## 11) Apêndice

### Comandos Úteis
*   `npx shadcn@latest diff`: Vê diferenças entre seus componentes e a base original.
*   `npm run lint`: Checa erros de lint.

### Troubleshooting
*   **Hydration Error**: Geralmente causado por datas (`new Date()`) renderizadas no servidor vs cliente. Use `useEffect` ou uma lib como `date-fns` formatando de forma consistente.
*   **Tailwind Styles Missing**: Verifique se o arquivo está incluso no `content` do `tailwind.config.ts`.
