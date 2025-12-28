import { SafeUser } from "./auth";
import { getSafeUser } from "./auth.server";
import { Module, canWrite, hasAccess } from "./permissions";

/**
 * Server-side version: Gets the safe user and verifies permission.
 * Throws an error if access is denied.
 * Use this in Server Actions.
 */
export async function requirePermission(
    module: Module,
    action: 'write' | 'read' = 'write'
): Promise<SafeUser> {
    const user = await getSafeUser();

    const hasPerm = action === 'write'
        ? canWrite(user.role, module)
        : hasAccess(user.role, module);

    if (!hasPerm) {
        throw new Error(`Acesso negado: A sua função (${user.role}) não tem permissão de ${action} no módulo ${module}.`);
    }

    return user;
}

