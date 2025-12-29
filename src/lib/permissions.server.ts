import { SafeUser } from "./auth";
import { getSafeUser } from "./auth.server";
import { Module, canWrite, hasAccess } from "./permissions";
import { createAdminClient } from "./supabase/admin";

/**
 * Server-side version: Gets the safe user and verifies permission.
 * Throws an error if access is denied.
 * Checks for database overrides in role_permissions table.
 */
export async function requirePermission(
    module: Module,
    action: 'write' | 'read' = 'write'
): Promise<SafeUser> {
    const user = await getSafeUser();
    const supabase = createAdminClient();

    // 1. Check for database override
    const { data: override } = await supabase
        .from('role_permissions')
        .select('access_level')
        .eq('role', user.role)
        .eq('module', module)
        .single();

    let hasPerm = false;

    if (override) {
        const level = override.access_level;
        hasPerm = action === 'write'
            ? (level === 'full' || level === 'own')
            : (level !== 'none');
    } else {
        // 2. Fallback to hardcoded defaults
        hasPerm = action === 'write'
            ? canWrite(user.role, module)
            : hasAccess(user.role, module);
    }

    if (!hasPerm) {
        throw new Error(`Acesso negado: A sua função (${user.role}) não tem permissão de ${action} no módulo ${module}.`);
    }

    return user;
}

