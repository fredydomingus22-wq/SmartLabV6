"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUserContext() {
    return useQuery({
        queryKey: ["user-context"],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: profile } = await supabase
                .from("user_profiles")
                .select("organization_id, plant_id, role, full_name")
                .eq("id", user.id)
                .single();

            return {
                id: user.id,
                email: user.email,
                organizationId: profile?.organization_id,
                plantId: profile?.plant_id,
                role: profile?.role,
                fullName: profile?.full_name,
            };
        },
        staleTime: Infinity, // Context doesn't change often
    });
}
