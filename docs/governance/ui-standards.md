# SmartLab UI Standards – Global Visual System

**Owner:** UI/UX Design Specialist
**Co-Owner:** Software Architect

## 1. Objective
Estabelecer um sistema de design **atómico e industrial** para o SmartLab Enterprise. Estas regras são absolutas e devem ser seguidas por todos os agentes e desenvolvedores para garantir consistência visual perfeita.

---

## 2. Princípios de Visual Design (Mandatório)

1. **Shadcn/UI + Radix por Padrão**
   - **Framework**: Shadcn/ui (Radix Primitives) é a única biblioteca de componentes autorizada.
   - **Styling**: Tailwind CSS v4 para utilitários.
   - **Proibido**: CSS modules customizados ou estilos inline (`style={{...}}`) salvo exceções de gráficos (ECharts).

2. **Consistência > Criatividade Local**
   - Um botão `Secondary` deve ser idêntico no MES e no QMS.
   - Espaçamentos devem seguir a escala rígida do Tailwind (4px grid).

---

## 3. Tipografia & Hierarquia
**Font Family**: `Inter` (Sans-serif) para UI, `Geist Mono` para dados técnicos.

| Elemento | Token Tailwind | Tamanho/Peso | Uso |
|---|---|---|---|
| **Page Title** | `text-2xl font-semibold tracking-tight` | 24px/600 | H1 Principal |
| **Section Header** | `text-lg font-medium` | 18px/500 | Títulos de Cards/Seções |
| **Body Text** | `text-sm text-foreground` | 14px/400 | Texto padrão |
| **Data/Mono** | `font-mono text-xs` | 12px/400 | IDs, Lotes, Valores SPC |
| **Microcopy** | `text-xs text-muted-foreground` | 12px/400 | Legendas, Help text |

---

## 4. Cores & Temas (Semantic Tokens)
NUNCA usar códigos Hex (`#FFFFFF`). Usar sempre variáveis semânticas CSS (`var(--background)`).

| Token Semântico | Uso Correto |
|---|---|
| `bg-background` | Fundo da página principal. |
| `bg-card` | Fundo de containers, cards e dialogs (Elevado). |
| `bg-muted` | Fundo secundário, áreas de "read-only" ou headers de tabelas. |
| `text-foreground` | Texto principal (alto contraste). |
| `text-muted-foreground` | Texto secundário (médio contraste). |
| `border-border` | Bordas de containers e inputs. |
| `bg-primary` | Ações principais (Brand color). |
| `bg-destructive` | Ações de perigo (Delete, Block). |

---

## 5. Espaçamento & Alinhamento (4px Grid)

### 5.1 Paddings Oficiais
- **Page Container**: `p-6` (Desktop), `p-4` (Mobile).
- **Card Body**: `p-6` (Standard), `p-4` (Compact).
- **Dialog Body**: `p-6`.
- **Input/Button**: `h-9 px-4 py-2` (Standard do shadcn).

### 5.2 Gaps (Espaçamento entre elementos)
- **Form Groups**: `gap-4` (entre um input e outro).
- **Section Gaps**: `gap-6` (entre cards ou seções).
- **List Items**: `gap-2` (itens dentro de uma lista).

### 5.3 Alinhamento de Containers
- **Grids de Cards**: Usar `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
- **Flex Rows**: Usar `items-center` para alinhar ícones e texto verticalmente.

---

## 6. Iconografia & Feedback
- **Biblioteca**: Lucide React.
- **Tamanho Padrão**: `h-4 w-4` (botões/text), `h-5 w-5` (ícones soltos).
- **Stroke**: `stroke-[1.5px]` para elegância industrial.

---

## 7. Tipos Oficiais de Containers

### 7.1 KPI Card (Summary Card)
- **Tamanho**: `h-[120px]`.
- **Estrutura**: Ícone (topo esq), Valor (centro/grande), Título (topo), Delta (baixo).

### 7.2 Page Header – Padrão Global
- **Altura**: `min-h-[64px]`.
- **Padding**: `py-4`.
- **Layout**: Flex row, `justify-between`, `items-center`.

---

## 8. Governança
- O **UI/UX Design Specialist** deve rejeitar qualquer PR que viole "Magic Numbers" (valores arbitrários de pixel) ou use cores fora do tema.
