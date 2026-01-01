"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export interface MatrixEntry {
    user_id: string;
    user_name: string;
    job_title: string;
    modules: {
        [moduleId: string]: {
            status: string;
            score?: number;
            due_date?: string;
        };
    };
}

export interface TrainingModuleMeta {
    id: string;
    title: string;
}

export async function getTrainingMatrixData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch all users (simulated via profiles or auth/users view if accessible)
    // Using user_profiles for metadata
    const { data: userProfiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, full_name, job_title")
        .order("full_name");

    if (profilesError) throw new Error(profilesError.message);

    // 2. Fetch all modules
    const { data: modules, error: modulesError } = await supabase
        .from("training_modules")
        .select("id, title")
        .order("title");

    if (modulesError) throw new Error(modulesError.message);

    // 3. Fetch all assignments
    const { data: assignments, error: assignmentsError } = await supabase
        .from("training_assignments")
        .select("user_id, module_id, status, score, due_date");

    if (assignmentsError) throw new Error(assignmentsError.message);

    // 4. Construct Matrix
    const matrix: MatrixEntry[] = userProfiles.map(p => {
        const userAssignments = assignments.filter((a: any) => a.user_id === p.id);
        const moduleMap: Record<string, any> = {};

        userAssignments.forEach((a: any) => {
            moduleMap[a.module_id] = {
                status: a.status,
                score: a.score,
                due_date: a.due_date
            };
        });

        return {
            user_id: p.id,
            user_name: p.full_name,
            job_title: p.job_title || 'N/A',
            modules: moduleMap
        };
    });

    return {
        data: {
            users: matrix,
            modules: modules as TrainingModuleMeta[]
        }
    };
}
