import { SupabaseClient } from "@supabase/supabase-js";

export interface DomainContext {
    organization_id: string;
    plant_id?: string;
    user_id: string;
    role: string;
    correlation_id: string; // For tracing related actions in audit
}

export interface DomainResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
}

export class DomainError extends Error {
    constructor(
        public message: string,
        public code: string = 'DOMAIN_ERROR',
        public details?: any
    ) {
        super(message);
        this.name = 'DomainError';
    }
}
