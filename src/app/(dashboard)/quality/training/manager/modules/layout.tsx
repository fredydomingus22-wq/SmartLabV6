import { createClient } from "@/lib/supabase/server";
import ModulesPage from "./page";

export default async function ModulesLayout() {
    const supabase = await createClient();

    const { data: modules } = await supabase
        .from("training_modules")
        .select("*")
        .order("created_at", { ascending: false });

    return <ModulesPage modules={modules || []} />;
}
