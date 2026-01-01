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

export const CreateLabAssetSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    code: z.string().min(1, "Código é obrigatório"),
    asset_category: z.enum([
        "balance", "ph_meter", "refractometer", "thermometer",
        "spectrophotometer", "viscometer", "general"
    ]),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
    calibration_date: z.string().optional(),
    next_calibration_date: z.string().optional(),
    criticality: z.enum(["low", "medium", "high"]).default("medium"),
    status: z.enum(["active", "maintenance", "decommissioned"]).default("active"),
    plant_id: z.string().uuid().optional(),
});

export type CreateLabAssetFormValues = z.infer<typeof CreateLabAssetSchema>;
