/**
 * Role-Based Access Control (RBAC) Shared Logic
 * 
 * This module defines the permission matrix and pure helper functions
 * that are safe to use in both Server and Client Components.
 */

// All available roles in the system
export type UserRole =
    | 'system_owner'
    | 'admin'
    | 'qa_manager'
    | 'qc_supervisor'
    | 'lab_analyst'
    | 'micro_analyst'
    | 'analyst'
    | 'operator'
    | 'auditor'
    | 'quality'
    | 'haccp'
    | 'warehouse'
    | 'rmpm_lab'
    | 'lab_tech'; // Legacy, kept for compatibility

// Modules in the application
export type Module =
    | 'dashboard'
    | 'lab'
    | 'micro'
    | 'production'
    | 'cip'
    | 'qms'
    | 'haccp'
    | 'materials'
    | 'reports'
    | 'settings'
    | 'tasks'
    | 'assets'
    | 'saas';

// Access levels
export type AccessLevel = 'full' | 'read' | 'own' | 'none';

// Permission matrix: Role -> Module -> AccessLevel
const PERMISSIONS: Record<UserRole, Partial<Record<Module, AccessLevel>>> = {
    system_owner: {
        dashboard: 'full',
        saas: 'full',
        reports: 'read',
        tasks: 'read',
    },
    admin: {
        dashboard: 'full',
        lab: 'full',
        micro: 'full',
        production: 'full',
        cip: 'full',
        qms: 'full',
        haccp: 'full',
        materials: 'full',
        reports: 'full',
        settings: 'full',
        tasks: 'full',
        assets: 'full',
    },
    qa_manager: {
        dashboard: 'full',
        lab: 'full',
        micro: 'full',
        production: 'full',
        cip: 'full',
        qms: 'full',
        haccp: 'full',
        materials: 'read',
        reports: 'full',
        tasks: 'full',
        assets: 'full',
    },
    qc_supervisor: {
        dashboard: 'full',
        lab: 'full',
        micro: 'full',
        production: 'read',
        cip: 'read',
        qms: 'read',
        reports: 'full',
        tasks: 'full',
    },
    lab_analyst: {
        dashboard: 'full',
        lab: 'own',
        production: 'own',
        cip: 'own',
        haccp: 'own',
        reports: 'own',
        tasks: 'own',
        assets: 'own',
    },
    micro_analyst: {
        dashboard: 'full',
        lab: 'none',
        micro: 'own',
        production: 'read',
        qms: 'read',
        reports: 'read',
        tasks: 'own',
    },
    analyst: {
        dashboard: 'full',
        lab: 'own',
        micro: 'own',
        production: 'read',
        qms: 'read',
        reports: 'read',
        tasks: 'own',
    },
    operator: {
        dashboard: 'full',
        production: 'full',
        cip: 'full',
        materials: 'read',
        tasks: 'own',
    },
    auditor: {
        dashboard: 'read',
        lab: 'read',
        micro: 'read',
        production: 'read',
        reports: 'full',
        tasks: 'own',
    },
    quality: {
        dashboard: 'full',
        lab: 'full',
        micro: 'full',
        production: 'read',
        cip: 'full',
        qms: 'full',
        haccp: 'full',
        materials: 'read',
        reports: 'full',
        tasks: 'full',
        assets: 'full',
    },
    haccp: {
        dashboard: 'full',
        haccp: 'full',
        qms: 'read',
        tasks: 'own',
    },
    warehouse: {
        dashboard: 'full',
        materials: 'full',
        production: 'read',
        tasks: 'own',
    },
    lab_tech: {
        dashboard: 'full',
        lab: 'own',
        micro: 'own',
        production: 'read',
        qms: 'read',
        tasks: 'own',
    },
    rmpm_lab: {
        dashboard: 'full',
        lab: 'own',
        materials: 'full',
        reports: 'read',
        tasks: 'own',
        assets: 'own',
    },
};

/**
 * Check if a role has access to a module
 */
export function hasAccess(role: string, module: Module): boolean {
    const userRole = role as UserRole;
    const access = PERMISSIONS[userRole]?.[module];
    return access !== undefined && access !== 'none';
}

/**
 * Get the access level for a role on a module
 */
export function getAccessLevel(role: string, module: Module): AccessLevel {
    const userRole = role as UserRole;
    return PERMISSIONS[userRole]?.[module] || 'none';
}

/**
 * Check if a role can write (create/update/delete) in a module
 */
export function canWrite(role: string, module: Module): boolean {
    const level = getAccessLevel(role, module);
    return level === 'full' || level === 'own';
}

/**
 * Check if a role can only access their own records
 */
export function isOwnOnly(role: string, module: Module): boolean {
    return getAccessLevel(role, module) === 'own';
}

/**
 * Get all modules a role has access to
 */
export function getAccessibleModules(role: string): Module[] {
    const userRole = role as UserRole;
    const perms = PERMISSIONS[userRole];
    if (!perms) return [];

    return Object.entries(perms)
        .filter(([_, level]) => level !== 'none')
        .map(([module]) => module as Module);
}

/**
 * Check if role is a system-level role (no tenant context)
 */
export function isSystemRole(role: string): boolean {
    return role === 'system_owner';
}

/**
 * Check if role is an analyst type
 */
export function isAnalyst(role: string): boolean {
    return ['lab_analyst', 'micro_analyst', 'analyst', 'lab_tech', 'rmpm_lab'].includes(role);
}

/**
 * Check if role is a manager type
 */
export function isManager(role: string): boolean {
    return ['admin', 'qa_manager', 'quality', 'qc_supervisor'].includes(role);
}
