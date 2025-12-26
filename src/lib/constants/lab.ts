/**
 * Standardized Sample Types for the LIMS
 * These are the hardcoded definitions for all sample types in the system.
 */

export const SAMPLE_TYPE_CATEGORIES = {
    PHYSICO_CHEMICAL: "physico_chemical",
    MICROBIOLOGICAL: "microbiological",
} as const;

export type SampleTypeCategory = typeof SAMPLE_TYPE_CATEGORIES[keyof typeof SAMPLE_TYPE_CATEGORIES];

export interface SampleTypeDefinition {
    code: string;
    name: string;
    category: SampleTypeCategory;
}

export const SAMPLE_TYPES: Record<string, SampleTypeDefinition> = {
    RAW_FQ: {
        code: "RAW-FQ",
        name: "Raw Material (FQ)",
        category: "physico_chemical",
    },
    RAW_MICRO: {
        code: "RAW-MICRO",
        name: "Raw Material (Micro)",
        category: "microbiological",
    },
    IP_FQ: {
        code: "IP-FQ",
        name: "Intermediate Product (FQ)",
        category: "physico_chemical",
    },
    IP_MICRO: {
        code: "IP-MICRO",
        name: "Intermediate Product (Micro)",
        category: "microbiological",
    },
    FP_FQ: {
        code: "FP-FQ",
        name: "Finished Product (FQ)",
        category: "physico_chemical",
    },
    FP_MICRO: {
        code: "FP-MICRO",
        name: "Finished Product (Micro)",
        category: "microbiological",
    },
    UT_FQ: {
        code: "UT-FQ",
        name: "Utilities (FQ)",
        category: "physico_chemical",
    },
    UT_MICRO: {
        code: "UT-MICRO",
        name: "Utilities (Micro)",
        category: "microbiological",
    },
    ENV_MICRO: {
        code: "ENV-MICRO",
        name: "Environmental (Micro)",
        category: "microbiological",
    },
    SB_MICRO: {
        code: "SB-MICRO",
        name: "Sanitation (Swabs)",
        category: "microbiological",
    },
} as const;

/**
 * Helper to check if a code belongs to a specific category
 */
export const isFinishedProduct = (code: string) => code.startsWith("FP");
export const isIntermediateProduct = (code: string) => code.startsWith("IP");
export const isRawMaterial = (code: string) => code.startsWith("RAW");
export const isUtility = (code: string) => code.startsWith("UT");
export const isMicroCategory = (category: string) => category === SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL;
export const isFQCategory = (category: string) => category === SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL;
