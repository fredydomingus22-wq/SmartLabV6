import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get all document categories
 */
export async function getDocCategories() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("doc_categories")
        .select("*, parent_id")
        .eq("organization_id", user.organization_id)
        .order("name", { ascending: true });

    return { data: data || [], error };
}

/**
 * Get all documents with their current version and category
 */
export async function getDocuments(filters?: {
    categoryId?: string;
    status?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("documents")
        .select(`
      *,
      category:doc_categories(name, code),
      current_version:document_versions!current_version_id(*)
    `)
        .eq("organization_id", user.organization_id)
        .order("updated_at", { ascending: false });

    if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
    }

    // If status filter is provided, we filter by the current version's status
    if (filters?.status) {
        // Note: This requires the current_version join to exist
        // Alternatively, we could filter by documents that have a current version with that status
        // For now, simple client side or subquery
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

/**
 * Get a single document with all its versions and approval history
 */
export async function getDocumentById(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: document, error: docError } = await supabase
        .from("documents")
        .select(`
      *,
      category:doc_categories(*),
      versions:document_versions(*, approvals:document_approvals(*, approver:user_profiles!approver_id(full_name))),
      periodic_reviews:doc_periodic_reviews(*)
    `)
        .eq("organization_id", user.organization_id)
        .eq("id", id)
        .single();

    if (docError) return { document: null, versions: [], error: docError };

    // Sort versions by number or date
    const sortedVersions = (document.versions || []).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { document, versions: sortedVersions, error: null };
}

/**
 * Get all plants in the organization
 */
export async function getPlants() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("plants")
        .select("id, name, code")
        .eq("organization_id", user.organization_id)
        .order("name");

    return { data: data || [], error };
}

/**
 * Get all users who can act as approvers (Filter by role in next iteration)
 */
export async function getApprovers() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, role")
        .eq("organization_id", user.organization_id)
        .order("full_name");

    return { data: data || [], error };
}

/**
 * Get a specific document version and its approval history
 */
export async function getDocumentVersion(versionId: string) {
    const supabase = await createClient();

    const { data: version, error: versionError } = await supabase
        .from("document_versions")
        .select(`
      *,
      document:documents(title, doc_number),
      approvals:document_approvals(*)
    `)
        .eq("id", versionId)
        .single();

    return { version, error: versionError };
}

/**
 * Get reading logs for a specific document version
 */
export async function getReadingLogs(versionId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("doc_reading_logs")
        .select(`
            *,
            user:user_profiles!user_id(full_name, role)
        `)
        .eq("organization_id", user.organization_id)
        .eq("version_id", versionId)
        .order("read_at", { ascending: false });

    return { data: data || [], error };
}

/**
 * Get pending periodic reviews for the organization/plant
 */
export async function getPendingPeriodicReviews() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("doc_periodic_reviews")
        .select(`
            *,
            document:documents(title, doc_number)
        `)
        .eq("organization_id", user.organization_id)
        .eq("result", "pending")
        .order("scheduled_date", { ascending: true });

    return { data: data || [], error };
}
