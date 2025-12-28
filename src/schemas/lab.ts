import { z } from "zod";

export const CreateSampleSchema = z.object({
    sample_type_id: z.string().uuid("Sample Type is required"),
    code: z.string().optional(),
    production_batch_id: z.string().uuid().optional(),
    intermediate_product_id: z.string().uuid().optional(),
    sampling_point_id: z.string().uuid().optional(),
    plant_id: z.string().uuid().optional(), // Often injected by server action
    collected_at: z.string().optional(), // For datetime-local input
    assignee_id: z.string().uuid().optional(),
});

export type CreateSampleFormValues = z.infer<typeof CreateSampleSchema>;
