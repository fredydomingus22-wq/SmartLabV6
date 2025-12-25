import { z } from "zod";

export const EnvironmentalZoneSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    risk_level: z.number().min(1).max(4),
    plant_id: z.string().uuid().optional(),
});

export const SamplingPointSchema = z.object({
    zone_id: z.string().uuid("Zone is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    frequency: z.string().min(1, "Frequency is required"),
    plant_id: z.string().uuid().optional(),
});

export const TACCPAssessmentSchema = z.object({
    area_name: z.string().min(1, "Area name is required"),
    threat_description: z.string().optional(),
    threat_type: z.enum(['cyber', 'physical_outside', 'physical_inside', 'supply_chain']),
    likelihood: z.number().min(1).max(5),
    consequence: z.number().min(1).max(5),
    mitigation_measures: z.string().optional(),
    responsible_id: z.string().uuid().optional(),
    plant_id: z.string().uuid().optional(),
    status: z.enum(['active', 'review_pending', 'retired']).default('active'),
});

export const VACCPVulnerabilitySchema = z.object({
    material_id: z.string().uuid("Material is required"),
    fraud_history_score: z.number().min(1).max(5),
    economic_gain_potential: z.number().min(1).max(5),
    detection_ease_score: z.number().min(1).max(5),
    mitigation_strategy: z.string().optional(),
    plant_id: z.string().uuid().optional(),
});

export type EnvironmentalZoneFormValues = z.infer<typeof EnvironmentalZoneSchema>;
export type SamplingPointFormValues = z.infer<typeof SamplingPointSchema>;
export type TACCPFormValues = z.infer<typeof TACCPAssessmentSchema>;
export type VACCPFormValues = z.infer<typeof VACCPVulnerabilitySchema>;
