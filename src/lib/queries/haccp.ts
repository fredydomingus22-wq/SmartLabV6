import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export async function getPRPTemplates() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fetch templates and include the latest execution for status
    const { data: templates, error } = await supabase
        .from("haccp_prp_templates")
        .select(`
            *,
            haccp_prp_executions (
                id,
                completed_at,
                executed_by
            )
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching PRP templates:", error);
        return [];
    }

    // Process to get only the LATEST execution for each
    return templates.map(t => ({
        ...t,
        latest_execution: t.haccp_prp_executions?.length > 0
            ? t.haccp_prp_executions.sort((a: any, b: any) =>
                new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
            )[0]
            : null
    }));
}

export async function getPRPTemplateItems(templateId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("haccp_prp_items")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching PRP items:", error);
        return [];
    }

    return data;
}

