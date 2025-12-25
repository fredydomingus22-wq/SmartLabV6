"use server";

import { quickSearch } from "@/lib/queries/search";

export async function globalSearchAction(query: string) {
    try {
        const results = await quickSearch(query);
        return { success: true, data: results };
    } catch (error) {
        console.error("Search Action Error:", error);
        return { success: false, error: "Falha na pesquisa" };
    }
}
