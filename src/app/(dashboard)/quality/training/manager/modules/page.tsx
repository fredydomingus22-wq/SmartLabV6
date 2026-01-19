import { createClient } from "@/lib/supabase/server";
import { ModulesClient } from "./modules-client";

export default async function ModulesPage() {
    const supabase = await createClient();

    const { data: modules } = await supabase
        .from("training_modules")
        .select("*")
        .order("created_at", { ascending: false });

    // Ensure type safety matches the interface in ModulesClient
    const typedModules = (modules || []).map((m: any) => ({
        ...m,
        type: m.type as 'document' | 'video' | 'quiz' | 'external'
    }));

    return <ModulesClient modules={typedModules} />;
}
