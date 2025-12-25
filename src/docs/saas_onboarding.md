# Guia de Configuração: System Owner (SaaS)

Este documento descreve como configurar o primeiro utilizador com a função `system_owner` e como utilizar a Consola Global.

## 1. Criação do Utilizador no Supabase

Para obter acesso à consola `/saas`, um utilizador deve ter a role `system_owner` na tabela `user_profiles`.

### Passo A: Criar o utilizador via Auth
Crie um utilizador normalmente através do ecrã de Sign Up da aplicação ou via o Dashboard do Supabase (Authentication > Users > Add User).

### Passo B: Elevar Privilégios (SQL)
No SQL Editor do Supabase, execute o seguinte comando (substituindo pelo email do utilizador):

```sql
UPDATE user_profiles 
SET role = 'system_owner'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'o-seu-email@exemplo.com'
);
```

## 2. Acesso à Consola
Após o login, se o utilizador possuir a role correta:
1. Verá o link **"Sistema (SaaS)"** na barra lateral.
2. Poderá aceder diretamente a [URL_DA_APP]/saas.

## 3. Funcionalidades de Gestão

### Gestão de Tenants (Organizações)
- **Criação**: Registe novas empresas fornecendo o nome e o `slug` (identificador único na URL).
- **Status**: Ative ou suspenda organizações. Uma organização suspensa impedirá o login dos seus utilizadores.

### Gestão de Utilizadores Globais
- Permite criar administradores para qualquer organização a partir de um ponto central.
- **Nota**: A criação via consola global ignora as restrições de self-signup configuradas em cada tenant.

## 4. Segurança e Auditoria
- Todas as ações críticas (Criação/Eliminação/Alteração de Status) são registadas na tabela `system_audit_logs`.
- Estes logs são imutáveis e podem ser consultados via SQL Editor para fins de conformidade (ISO 27001).

> [!CAUTION]
> A role `system_owner` ignora as políticas de RLS através das Server Actions administrativas. Utilize apenas para manutenção do sistema.
