"use server";

import * as queries from "@/lib/queries/reports";

export async function getReportHistoryAction(filters?: { type?: string; limit?: number }) {
    return queries.getReportHistory(filters);
}

export async function getSamplesForCoAAction() {
    return queries.getSamplesForCoA();
}

export async function getBatchesForReportAction() {
    return queries.getBatchesForReport();
}

export async function getReportsAnalyticsAction() {
    return queries.getReportsAnalytics();
}
