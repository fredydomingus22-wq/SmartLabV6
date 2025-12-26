import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { styles } from '../styles';

// Reuse types or define similar ones
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
    name: string; // e.g., "Raw Materials", "Intermediate", "Final Product"
    samples: SampleWithResults[];
}

interface OrganizationData {
    name: string;
    address: string;
    logoUrl?: string;
}

interface BatchReportProps {
    batchCode: string;
    productName: string;
    startDate: string;
    endDate?: string;
    organization: OrganizationData;
    phases: PhaseGroup[];
}

export const BatchProductionReport = ({
    batchCode,
    productName,
    startDate,
    endDate,
    organization,
    phases
}: BatchReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logo}>
                    {organization.logoUrl ? (
                        <Image src={organization.logoUrl} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Text>LOGO</Text>
                    )}
                </View>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{organization.name}</Text>
                    <Text>{organization.address}</Text>
                </View>
            </View>

            <Text style={styles.title}>Production Batch Record</Text>

            {/* Batch Overview */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Batch Information</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Product:</Text>
                    <Text style={styles.value}>{productName}</Text>
                    <Text style={styles.label}>Batch Code:</Text>
                    <Text style={styles.value}>{batchCode}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Start Date:</Text>
                    <Text style={styles.value}>{startDate}</Text>
                    <Text style={styles.label}>End Date:</Text>
                    <Text style={styles.value}>{endDate || 'Ongoing'}</Text>
                </View>
            </View>

            {/* Phases Loop */}
            {phases.map((phase, pIndex) => (
                <View key={pIndex} style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1 }}>
                        Phase: {phase.name}
                    </Text>

                    {/* Samples Loop within Phase */}
                    {phase.samples.length === 0 ? (
                        <Text style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 10 }}>No samples recorded for this phase.</Text>
                    ) : (
                        phase.samples.map((sample, sIndex) => (
                            <View key={sIndex} style={{ marginBottom: 15, paddingLeft: 10 }}>

                                {/* Sample Header inside Phase */}
                                <View style={{ flexDirection: 'row', backgroundColor: '#fafafa', padding: 5, marginBottom: 5 }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', width: '20%' }}>{sample.sample_code}</Text>
                                    <Text style={{ fontSize: 10, width: '30%' }}>{sample.collection_date}</Text>
                                    <Text style={{ fontSize: 10, width: '30%' }}>{sample.sample_type || 'Generic'}</Text>
                                    <Text style={{ fontSize: 10, width: '20%', color: sample.overall_status === 'compliant' ? 'green' : 'red' }}>
                                        {sample.overall_status}
                                    </Text>
                                </View>

                                {/* Results Table for Sample */}
                                <View style={styles.table}>
                                    <View style={styles.tableRow}>
                                        <View style={[styles.tableColHeader, { width: '40%' }]}>
                                            <Text style={styles.tableCellHeader}>Parameter</Text>
                                        </View>
                                        <View style={[styles.tableColHeader, { width: '30%' }]}>
                                            <Text style={styles.tableCellHeader}>Result</Text>
                                        </View>
                                        <View style={[styles.tableColHeader, { width: '30%' }]}>
                                            <Text style={styles.tableCellHeader}>Status</Text>
                                        </View>
                                    </View>
                                    {sample.analyses.map((analysis, aIndex) => (
                                        <View style={styles.tableRow} key={aIndex}>
                                            <View style={[styles.tableCol, { width: '40%' }]}>
                                                <Text style={styles.tableCell}>{analysis.parameter_name}</Text>
                                            </View>
                                            <View style={[styles.tableCol, { width: '30%' }]}>
                                                <Text style={styles.tableCell}>{analysis.result} {analysis.unit}</Text>
                                            </View>
                                            <View style={[styles.tableCol, { width: '30%' }]}>
                                                <Text style={styles.tableCell}>{analysis.status}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                            </View>
                        ))
                    )}
                </View>
            ))}

            {/* Footer */}
            <View style={styles.footer}>
                <Text render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages} - Batch: ${batchCode}`
                )} fixed />
            </View>
        </Page>
    </Document>
);
