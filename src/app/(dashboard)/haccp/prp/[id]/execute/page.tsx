import { getPRPTemplateItems } from "@/lib/queries/haccp";
import { PRPChecklistForm } from "./prp-checklist-form";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function PRPExecutePage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Template Name
    const { data: template, error: templateError } = await supabase
        .from("haccp_prp_templates")
        .select("id, name")
        .eq("id", id)
        .single();

    if (templateError || !template) {
        notFound();
    }

    const items = await getPRPTemplateItems(id);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Execute Checklist</h1>
                <p className="text-muted-foreground">
                    Record process verification for {template.name}.
                </p>
            </div>

            <PRPChecklistForm template={template} items={items} />
        </div>
    );
}
