import { SupabaseClient } from "@supabase/supabase-js";
import { DomainContext } from "../shared/industrial.context";
import { generateAnalysisHash } from "@/lib/utils/crypto";

/**
 * ElectronicSignatureService
 * Implements 21 CFR Part 11 compliant signatures.
 */
export class ElectronicSignatureService {
    constructor(
        private supabase: SupabaseClient,
        private context: DomainContext
    ) { }

    async verify(password: string): Promise<boolean> {
        // Method A: Database RPC (High Performance)
        const { data: rpcData, error: rpcError } = await this.supabase.rpc('verify_user_password', {
            p_user_id: this.context.user_id,
            p_password: password
        });

        if (!rpcError && rpcData === true) return true;

        // Method B: Auth API Fallback (Standard Verification)
        // Used if RPC fails, is missing, or hashing format differs.
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user?.email) {
            const { error: authError } = await this.supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });
            if (!authError) return true;
        }

        if (rpcError) {
            console.error("[ElectronicSignatureService] Combined verification failed. RPC Error:", rpcError);
        }

        return false;
    }

    /**
     * Generates an immutable hash of the data snapshot.
     */
    generateHash(params: {
        analysisId: string;
        sampleId: string;
        parameterId: string;
        value: string | number;
        timestamp: string;
    }): string {
        return generateAnalysisHash({
            ...params,
            userId: this.context.user_id,
            value: params.value.toString()
        });
    }
}
