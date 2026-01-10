export type IndustrialStatus =
    | 'pending'
    | 'active'
    | 'completed'
    | 'approved'
    | 'rejected'
    | 'blocked'
    | 'expired'
    | 'warning'
    | 'in_analysis'
    | 'under_review'
    | 'released';

export interface StatusConfig {
    label: string;
    color: string; // Tailwind text color
    bg: string;    // Tailwind bg color (with opacity)
    border: string; // Tailwind border color
    icon?: string;  // Lucide icon name (for dynamic rendering if needed)
}

export const INDUSTRIAL_STATUS_MAP: Record<IndustrialStatus, StatusConfig> = {
    pending: {
        label: 'Pendente',
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20'
    },
    active: {
        label: 'Ativo',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
    },
    in_analysis: {
        label: 'Em Análise',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
    },
    completed: {
        label: 'Concluído',
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20'
    },
    approved: {
        label: 'Aprovado',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30'
    },
    released: {
        label: 'Libertado',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30'
    },
    rejected: {
        label: 'Rejeitado',
        color: 'text-rose-400',
        bg: 'bg-rose-500/20',
        border: 'border-rose-500/30'
    },
    blocked: {
        label: 'Bloqueado',
        color: 'text-rose-500',
        bg: 'bg-rose-500/20',
        border: 'border-rose-500/40'
    },
    warning: {
        label: 'Aviso',
        color: 'text-amber-500',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30'
    },
    expired: {
        label: 'Expirado',
        color: 'text-rose-600',
        bg: 'bg-rose-600/10',
        border: 'border-rose-600/20'
    },
    under_review: {
        label: 'Em Revisão',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    }
};
