/**
 * Enterprise Report Registry
 * Defines all available reports, their requirements, and access control.
 */
import { z } from "zod";

export const ReportTypeEnum = z.enum([
    "coa",
    "batch_record",
    "micro_analysis",
    "shift_report",
    "nc_report"
]);

export type ReportType = z.infer<typeof ReportTypeEnum>;

export interface ReportConfig {
    id: ReportType;
    name: string;
    description: string;
    requiredPermissions: string[]; // RBAC permission keys
    getContext: (params: any) => Promise<any>;
    isAvailable: (context: any) => boolean;
}

export const ReportRegistry: Record<ReportType, ReportConfig> = {
    coa: {
        id: "coa",
        name: "Certificate of Analysis",
        description: "Official analysis certificate for product release",
        requiredPermissions: ["quality.reports.create"],
        getContext: async (params) => {
            // Placeholder: Context will be fetched by engine
            return params;
        },
        isAvailable: (context: any) => {
            // Rule: Sample must be approved/validated
            return context?.sample?.status === "approved" || context?.sample?.status === "validated";
        }
    },
    batch_record: {
        id: "batch_record",
        name: "Batch Production Record",
        description: "Complete trace of production batch",
        requiredPermissions: ["production.reports.view"],
        getContext: async (params) => params,
        isAvailable: (context: any) => !!context?.batch
    },
    micro_analysis: {
        id: "micro_analysis",
        name: "Microbiological Report",
        description: "Microbiological safety analysis",
        requiredPermissions: ["micro.reports.view"],
        getContext: async (params) => params,
        isAvailable: (context: any) => !!context?.microData
    },
    shift_report: {
        id: "shift_report",
        name: "Shift Report",
        description: "Shift performance summary",
        requiredPermissions: ["production.reports.view"],
        getContext: async (params) => params,
        isAvailable: () => true
    },
    nc_report: {
        id: "nc_report",
        name: "Non-Conformance Report",
        description: "Detailed NC investigation",
        requiredPermissions: ["quality.ncs.view"],
        getContext: async (params) => params,
        isAvailable: (context: any) => !!context?.nc
    }
};

export function getAvailableReports(userPermissions: string[], context: any): ReportConfig[] {
    return Object.values(ReportRegistry).filter(report => {
        // 1. Check Permissions
        const hasPermission = report.requiredPermissions.every(p => userPermissions.includes(p));
        if (!hasPermission) return false;

        // 2. Check Availability Rules
        // safe check if isAvailable is implemented
        return report.isAvailable ? report.isAvailable(context) : true;
    });
}
