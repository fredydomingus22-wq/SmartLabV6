'use client';

import React from 'react';
import { PDFDownloadButton } from './PDFDownloadButton';
import { BatchProductionReport } from './templates/BatchProductionReport';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

// Re-defining props here or importing them. 
// Importing detailed types from templates might be brittle if we change them often,
// but for now let's reproduce the shape.

interface AnalysisResult {
    parameter_name: string;
    result: string;
    unit: string;
    status: 'pending' | 'compliant' | 'non_compliant';
}

interface SampleWithResults {
    id: string;
    sample_code: string;
    collection_date: string;
    sample_type?: string;
    overall_status: string;
    analyses: AnalysisResult[];
}

interface PhaseGroup {
    name: string;
    samples: SampleWithResults[];
}

interface OrganizationData {
    name: string;
    address: string;
    logoUrl?: string;
}

interface BatchReportData {
    batchCode: string;
    productName: string;
    startDate: string;
    endDate?: string;
    organization: OrganizationData;
    phases: PhaseGroup[];
}

interface BatchReportButtonProps {
    data: BatchReportData;
}

export const BatchReportButton = ({ data }: BatchReportButtonProps) => {
    return (
        <PDFDownloadButton
            document={<BatchProductionReport {...data} />}
            fileName={`Batch_Report_${data.batchCode}.pdf`}
            label="Print Batch Record"
        />
    );
};
