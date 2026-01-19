import { createClient } from "@/lib/supabase/server";
import { PlansClient } from "./plans-client";

export default async function PlansPage() {
    const supabase = await createClient();

    const { data: plans } = await supabase
        .from("training_plans")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: modules } = await supabase
        .from("training_modules")
        .select("id, title");

    // Ensure type safety
    const typedPlans = (plans || []).map((p: any) => ({
        ...p,
        job_titles: Array.isArray(p.job_titles) ? p.job_titles : []
    }));

    return <PlansClient plans={typedPlans} modules={modules || []} />;
}
