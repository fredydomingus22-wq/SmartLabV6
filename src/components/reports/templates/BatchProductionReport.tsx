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

            {/* Phases Loop - Grouped by Sample Type with Pivot Table */}
            {phases.map((phase, pIndex) => {
                // Extract all unique parameters from this phase
                const allParams = new Set<string>();
                phase.samples.forEach(s => s.analyses.forEach(a => allParams.add(a.parameter_name)));
                const parameterColumns = Array.from(allParams);

                // Sort samples by date and time
                const sortedSamples = [...phase.samples].sort((a, b) =>
                    new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime()
                );

                // Group samples by date for separators
                let lastDate = '';

                return (
                    <View key={pIndex} style={{ marginTop: 20 }} wrap={false}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottomWidth: 1, paddingBottom: 4 }}>
                            {phase.name}
                        </Text>

                        {phase.samples.length === 0 ? (
                            <Text style={{ fontSize: 9, fontStyle: 'italic', marginBottom: 10, color: '#666' }}>
                                Sem amostras registadas nesta fase.
                            </Text>
                        ) : (
                            <View style={styles.table}>
                                {/* Table Header: Hora + Parameters */}
                                <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
                                    <View style={[styles.tableColHeader, { width: '12%' }]}>
                                        <Text style={[styles.tableCellHeader, { fontSize: 7 }]}>HORA</Text>
                                    </View>
                                    {parameterColumns.map((param, idx) => (
                                        <View key={idx} style={[styles.tableColHeader, { width: `${88 / parameterColumns.length}%` }]}>
                                            <Text style={[styles.tableCellHeader, { fontSize: 7 }]}>{param}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Table Body */}
                                {sortedSamples.map((sample, sIndex) => {
                                    // Parse date for separator logic
                                    const dateObj = new Date(sample.collection_date);
                                    const dateStr = dateObj.toLocaleDateString('pt-PT');
                                    const timeStr = dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                                    const showDateSeparator = dateStr !== lastDate;
                                    lastDate = dateStr;

                                    // Map parameter results to columns
                                    const paramResults: Record<string, { value: string; status: string }> = {};
                                    sample.analyses.forEach(a => {
                                        paramResults[a.parameter_name] = {
                                            value: `${a.result} ${a.unit}`,
                                            status: a.status
                                        };
                                    });

                                    return (
                                        <React.Fragment key={sIndex}>
                                            {/* Date Separator Row */}
                                            {showDateSeparator && (
                                                <View style={[styles.tableRow, { backgroundColor: '#e2e8f0' }]}>
                                                    <View style={{ width: '100%', padding: 3 }}>
                                                        <Text style={{ fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>
                                                            📅 {dateStr}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                            {/* Sample Data Row */}
                                            <View style={styles.tableRow}>
                                                <View style={[styles.tableCol, { width: '12%' }]}>
                                                    <Text style={[styles.tableCell, { fontSize: 8, fontWeight: 'bold' }]}>{timeStr}</Text>
                                                </View>
                                                {parameterColumns.map((param, idx) => {
                                                    const result = paramResults[param];
                                                    return (
                                                        <View key={idx} style={[styles.tableCol, { width: `${88 / parameterColumns.length}%` }]}>
                                                            <Text style={[
                                                                styles.tableCell,
                                                                {
                                                                    fontSize: 7,
                                                                    color: result?.status === 'compliant' ? '#059669' :
                                                                        result?.status === 'non_compliant' ? '#dc2626' : '#000'
                                                                }
                                                            ]}>
                                                                {result?.value || '—'}
                                                            </Text>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </React.Fragment>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                );
            })}

            {/* Footer */}
            <View style={styles.footer}>
                <Text render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages} - Batch: ${batchCode}`
                )} fixed />
            </View>
        </Page>
    </Document>
);
