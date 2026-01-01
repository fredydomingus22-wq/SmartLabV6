import { createClient } from "@/lib/supabase/server";
import PlansPage from "./page";

export default async function PlansLayout() {
    const supabase = await createClient();

    const { data: plans } = await supabase
        .from("training_plans")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: modules } = await supabase
        .from("training_modules")
        .select("id, title");

    return <PlansPage plans={plans || []} modules={modules || []} />;
}
