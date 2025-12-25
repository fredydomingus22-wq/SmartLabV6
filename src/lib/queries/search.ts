import { createClient } from "@/lib/supabase/server";

export async function quickSearch(query: string) {
    if (!query || query.length < 2) return { samples: [], batches: [] };

    const supabase = await createClient();

    // Search samples by code or notes
    const { data: samples } = await supabase
        .from("samples")
        .select("id, code, sample_type:sample_types(name)")
        .or(`code.ilike.%${query}%,notes.ilike.%${query}%`)
        .limit(5);

    // Search production batches by code
    const { data: batches } = await supabase
        .from("production_batches")
        .select("id, batch_code, product:products(name)")
        .ilike("batch_code", `%${query}%`)
        .limit(5);

    return {
        samples: samples || [],
        batches: batches || [],
    };
}
