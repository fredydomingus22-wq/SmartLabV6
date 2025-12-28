import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ShiftReportData } from "@/lib/queries/shift-report";
import { styles as commonStyles } from '../styles';

const styles = StyleSheet.create({
    ...commonStyles,
    // Shift specific styles
    kpiContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    kpiCard: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    kpiLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 14,
        fontWeight: 'black',
        color: '#0f172a',
    },
    subsectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: '#334155',
        textTransform: 'uppercase',
    },
    // Table styles
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        backgroundColor: '#f1f5f9',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    th: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
});

interface ShiftReportProps {
    data: ShiftReportData;
}

export const ShiftReportTemplate = ({ data }: ShiftReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.companyName}>SmartLab Enterprise</Text>
                    <Text>Shift Performance Report</Text>
                </View>
                <View style={styles.companyInfo}>
                    <Text>Date: {new Date(data.shiftInfo.date).toLocaleDateString()}</Text>
                    <Text>Shift: {data.shiftInfo.shift}</Text>
                    <Text>Interval: {new Date(data.shiftInfo.queryStartDate).toLocaleString()} - {new Date(data.shiftInfo.queryEndDate).toLocaleTimeString()}</Text>
                </View>
            </View>

            <Text style={styles.title}>Production Shift Summary</Text>

            {/* 1. Production KPIs */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Production Overview</Text>
                <View style={styles.kpiContainer}>
                    <KPICard label="Lines Active" value={data.production.linesActive} />
                    <KPICard label="Batches Started" value={data.production.batchesStarted} />
                    <KPICard label="Batches Completed" value={data.production.batchesCompleted} />
                    <KPICard label="Total Produced" value={data.production.totalQuantityProduced.toLocaleString()} />
                </View>
            </View>

            {/* 2. Quality KPIs */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quality Control</Text>
                <View style={styles.kpiContainer}>
                    <KPICard label="Samples Collected" value={data.quality.samplesCollected} />
                    <KPICard label="Analyzed" value={data.quality.samplesAnalyzed} />
                    <KPICard label="OOS Results" value={data.quality.oosCount} color={data.quality.oosCount > 0 ? '#e11d48' : undefined} />
                    <KPICard label="Conformity Rate" value={`${data.quality.conformityRate}%`} />
                </View>

                {/* Batch Quality Detail Cards */}
                <Text style={styles.subsectionTitle}>Active Batch Details</Text>

                <View style={{ gap: 8 }}>
                    {data.production.activeBatches?.map((batch, i) => (
                        <View key={i} style={styles.kpiCard}>
                            {/* Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6 }}>
                                <View>
                                    <Text style={{ fontSize: 10, fontWeight: 'black', color: '#0f172a' }}>{batch.batchCode}</Text>
                                    <Text style={{ fontSize: 9, color: '#64748b' }}>{batch.productName}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: batch.status === 'released' ? '#22c55e' : '#3b82f6' }}>
                                        {batch.status.toUpperCase()}
                                    </Text>
                                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Conformity: {batch.conformityRate}%</Text>
                                </View>
                            </View>

                            {/* Metrics Grid */}
                            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 8 }}>
                                <View>
                                    <Text style={styles.kpiLabel}>Samples</Text>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{batch.samplesAnalyzed}</Text>
                                </View>
                                <View>
                                    <Text style={styles.kpiLabel}>Tanks</Text>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{batch.tanksPrepared}</Text>
                                </View>
                                <View>
                                    <Text style={styles.kpiLabel}>OOS</Text>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: (batch.oosBreakdown?.length || 0) > 0 ? '#e11d48' : '#0f172a' }}>
                                        {batch.oosBreakdown?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                                    </Text>
                                </View>
                            </View>

                            {/* OOS Breakdown */}
                            {(batch.oosBreakdown?.length || 0) > 0 && (
                                <View style={{ marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                    {batch.oosBreakdown.map((oos, idx) => (
                                        <Text key={idx} style={{ fontSize: 8, backgroundColor: '#fecdd3', color: '#881337', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 }}>
                                            {oos.parameter}: {oos.count}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {/* AI Observation */}
                            <View style={{ backgroundColor: '#f0f9ff', padding: 6, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: '#0ea5e9' }}>
                                <Text style={{ fontSize: 8, color: '#0369a1', fontStyle: 'italic' }}>
                                    AI Insight: {batch.observations}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* 3. CIP & Hygiene */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>CIP & Hygiene</Text>
                <View style={styles.kpiContainer}>
                    <KPICard label="Cycles Completed" value={data.cip.cyclesCompleted} />
                    <KPICard label="Equipment Cleaned" value={data.cip.equipmentCleaned} />
                    <KPICard label="Cycles Failed" value={data.cip.cyclesFailed} color={data.cip.cyclesFailed > 0 ? '#e11d48' : undefined} />
                </View>
            </View>

            {/* 4. Issues & Blocks */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Incidents & Blocks</Text>
                <View style={styles.kpiContainer}>
                    <KPICard label="Pallets Blocked" value={data.blocks.palletsBlocked} color={data.blocks.palletsBlocked > 0 ? '#e11d48' : undefined} />
                    <KPICard label="NCs Raised" value={data.blocks.ncsRaised} color={data.blocks.ncsRaised > 0 ? '#e11d48' : undefined} />
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
                <Text>Generated by SmartLab Enterprise • {new Date().toLocaleString()}</Text>
                <Text render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} />
            </View>
        </Page>
    </Document>
);

const KPICard = ({ label, value, color }: { label: string, value: string | number, color?: string }) => (
    <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, color ? { color } : {}]}>{value}</Text>
    </View>
);
