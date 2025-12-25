# ERROR LOG - 2025-12-18

## Retrieval Failure on Sample Detail Page

- **Data**: 2025-12-18
- **Módulo**: Lab (LIMS) / Sample Detail
- **Severidade**: HIGH
- **Causa Raiz**: O componente `SampleDetailPage` estava tentando selecionar colunas inexistentes (`analysis_method`, `decimal_precision`) da tabela `qa_parameters`. Como as colunas não existem na base de dados (conforme `20251211000003_lims_core.sql`), a query do Supabase falhava silenciosamente ou retornava erro, resultando em "No parameters defined".
- **Solução Aplicada**: 
    - Removidas as colunas `analysis_method` e `decimal_precision` da seleção no `SampleDetailPage`.
    - Unificada a busca de `lab_analysis` dentro da query principal da `sample` para maior robustez com RLS.
    - Implementada normalização de dados (`analysesRaw.map`) para converter arrays de joins em objetos simples.
    - Restaurada a lógica de fetching de nomes de usuários (`collectedByName`, `validatedByName`).
- **Validação**: Verificação manual da query e tipos; adição de bloco de DEBUG visual no componente para monitorar erros.
- **Frase de Segurança**: “Cada erro não corrigido corretamente vira um defeito crítico em produção.”

---

# ERROR LOG - 2025-12-19

## Grid Contrast Failure (White Grids)

- **Data**: 2025-12-19
- **Módulo**: Global UI / Dashboard
- **Severidade**: HIGH
- **Causa Raiz**: Ausência da classe `.dark` no root DOM (`layout.tsx`), impedindo a ativação dos tokens CSS de tema escuro.
- **Solução Aplicada**: Adicionada classe `className="dark"` e `style={{ colorScheme: 'dark' }}` ao elemento `html` no `layout.tsx`.
- **Validação**: As grids e outros componentes shadcn agora seguem o esquema de cores definido em `globals.css`.
- **Frase de Segurança**: “Cada erro não corrigido corretamente vira um defeito crítico em produção.”

---

# ERROR LOG - 2025-12-23

## Audit Response Runtime Error (Perfil não encontrado)

- **Data**: 2025-12-23
- **Módulo**: Quality / Audits
- **Severidade**: HIGH
- **Causa Raiz**: O servidor action `submitAuditResponseAction` tentou fazer uma query na tabela `profiles` que não existe (o nome correto é `user_profiles`), causando exceção em tempo de execução quando o utilizador tentava submeter uma resposta.
- **Solução Aplicada**: Corrigido o nome da tabela para `user_profiles` em `audits.ts` e também em todos os métodos de `compliance.ts` que tinham o mesmo erro latente.
- **Validação**: Correção verificada via análise estática do código e verificação da schema da base de dados.
- **Frase de Segurança**: “Cada erro não corrigido corretamente vira um defeito crítico em produção.”

## Invalid Badge Variant in TACCP

- **Data**: 2025-12-23
- **Módulo**: HACCP / TACCP
- **Severidade**: LOW
- **Causa Raiz**: Uso da variante `warning` no componente `Badge`, que não existe na definição do design system shadcn (apenas `default`, `secondary`, `destructive`, `outline`).
- **Solução Aplicada**: Substituído por `secondary` com adição de classes Tailwind customizadas (bg-amber-500/20) para manter o visual amarelo de aviso.
- **Validação**: Código compilado e verificado visualmente.
