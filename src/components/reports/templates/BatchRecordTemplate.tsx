import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { EnterpriseBatchReportDTO, AnalyticalSection, Signature } from "@/lib/reports/report-dtos";
import { styles as commonStyles } from '../styles';

// Extension of common styles for Batch Record specific needs
const styles = StyleSheet.create({
    ...commonStyles,
    // Header Extensions
    headerLogo: {
        width: 40,
        height: 40,
        backgroundColor: '#0f172a',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLogoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        fontStyle: 'italic',
    },
    headerTitleContainer: {
        marginLeft: 10,
    },
    headerTitleMain: {
        fontSize: 12,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
    },
    headerTitleSub: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerMeta: {
        fontSize: 8,
        textAlign: 'right',
        lineHeight: 1.2,
    },
    headerMetaLabel: {
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Section Headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 15,
    },
    sectionBar: {
        width: 4,
        height: 14,
        backgroundColor: '#0f172a',
        marginRight: 6,
    },
    sectionTitleText: {
        fontSize: 10,
        fontWeight: 'black',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },

    // Grids
    grid2: {
        flexDirection: 'row',
        gap: 10,
    },
    col2: {
        flex: 1,
    },

    // Key/Value Groups
    kvGroup: {
        marginBottom: 4,
    },
    kvLabel: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 1,
    },
    kvValue: {
        fontSize: 10,
    },

    // Status Badge
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 2,
        borderWidth: 1,
        alignSelf: 'flex-start',
        fontSize: 8,
        fontWeight: 'black',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusReleased: {
        backgroundColor: '#ecfdf5',
        color: '#047857',
        borderColor: '#a7f3d0',
    },
    statusBlocked: {
        backgroundColor: '#fff1f2',
        color: '#be123c',
        borderColor: '#fecdd3',
    },

    // Tables
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#0f172a',
        paddingBottom: 4,
        marginBottom: 4,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    th: {
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94a3b8',
    },

    // Signatures
    sigBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 8,
        marginTop: 4,
    },
    sigIcon: {
        width: 24,
        height: 24,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        marginRight: 8,
    },

    // Footer
    pageFooter: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
    },
    footerText: {
        fontSize: 6,
        fontFamily: 'Courier',
        color: '#cbd5e1',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});

interface BatchRecordProps {
    data: EnterpriseBatchReportDTO;
}

export const BatchRecordTemplate = ({ data }: BatchRecordProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* 1. Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.headerLogo}>
                        <Text style={styles.headerLogoText}>SL</Text>
                    </View>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleMain}>SmartLab Enterprise</Text>
                        <Text style={styles.headerTitleSub}>Digital Quality Assurance</Text>
                    </View>
                </View>

                {/* Meta Info */}
                <View>
                    <MetaRow label="Plant" value={data.header.plantName} />
                    <MetaRow label="Document" value="Batch Quality Report" />
                    <MetaRow label="Product" value={data.header.productName} />
                    <MetaRow label="Batch Code" value={data.header.batchCode} />
                    <MetaRow label="Report ID" value={data.header.reportId} />
                </View>
            </View>

            {/* 2. Overview */}
            <SectionTitle title="1. Batch Overview" />
            <View style={[styles.grid2, { paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' }]}>
                <View style={styles.col2}>
                    <DetailRow label="Product Name" value={data.overview.productName} />
                    <DetailRow label="Batch Code" value={data.overview.batchCode} />
                    <DetailRow label="Production Period" value={data.overview.productionPeriod} />
                </View>
                <View style={styles.col2}>
                    <DetailRow label="Planned Quantity" value={`${data.overview.plannedQuantity.toLocaleString()} units`} />
                    <View style={styles.kvGroup}>
                        <Text style={styles.kvLabel}>Final Batch Status</Text>
                        <Text style={[
                            styles.statusBadge,
                            data.overview.finalStatus === 'RELEASED' ? styles.statusReleased : styles.statusBlocked
                        ]}>
                            {data.overview.finalStatus}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 3. Quality Summary */}
            <SectionTitle title="2. Quality Summary" />
            <View style={{ marginTop: 5 }}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: '40%' }]}>Discipline</Text>
                    <Text style={[styles.th, { width: '15%', textAlign: 'center' }]}>Samples</Text>
                    <Text style={[styles.th, { width: '15%', textAlign: 'center', color: '#059669' }]}>Approved</Text>
                    <Text style={[styles.th, { width: '15%', textAlign: 'center', color: '#e11d48' }]}>Rejected</Text>
                    <Text style={[styles.th, { width: '15%', textAlign: 'right' }]}>Status</Text>
                </View>
                {/* Rows */}
                {data.qualitySummary.map((q, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[{ width: '40%', fontSize: 9, fontWeight: 'bold' }]}>{q.discipline}</Text>
                        <Text style={[{ width: '15%', fontSize: 9, textAlign: 'center' }]}>{q.samples}</Text>
                        <Text style={[{ width: '15%', fontSize: 9, textAlign: 'center', fontWeight: 'bold', color: '#059669' }]}>{q.approved}</Text>
                        <Text style={[{ width: '15%', fontSize: 9, textAlign: 'center', fontWeight: 'bold', color: '#e11d48' }]}>{q.rejected}</Text>
                        <Text style={[{ width: '15%', fontSize: 8, textAlign: 'right', fontWeight: 'bold', color: q.status === 'APPROVED' ? '#059669' : '#d97706' }]}>
                            {q.status}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Overall Status */}
            <View style={{ marginTop: 10, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Overall Quality Status</Text>
                <Text style={{ fontSize: 12, fontWeight: 'black', textTransform: 'uppercase', borderBottomWidth: 2, borderColor: '#0f172a' }}>
                    {data.overview.finalStatus === 'RELEASED' ? "APPROVED" : "BLOCKED"}
                </Text>
            </View>

            {/* Footer */}
            <Text render={({ pageNumber, totalPages }) => (
                `Page ${pageNumber} of ${totalPages}`
            )} fixed style={{ position: 'absolute', top: 20, right: 30, fontSize: 8, color: '#0f172a', fontWeight: 'bold' }} />

            <View style={styles.pageFooter} fixed>
                <Text style={styles.footerText}>Generated by SmartLab Enterprise. Modification Invalidates Report.</Text>
                <Text style={styles.footerText}>ID: {data.releaseDecision.approver.signatureId || "AUDIT-TRAIL"}</Text>
            </View>
        </Page>

        {/* 4. Analytical Sections (One page per major section usually needed, or flow) */}
        {/* FQ Analysis */}
        {data.fqAnalysis.map((section, idx) => (
            <AnalyticsPage
                key={`fq-${idx}`}
                index={3}
                title="Final Product – Physicochemical Analysis"
                section={section}
                data={data}
            />
        ))}

        {/* Micro Analysis */}
        {data.microAnalysis.map((section, idx) => (
            <AnalyticsPage
                key={`micro-${idx}`}
                index={4}
                title="Final Product – Microbiological Analysis"
                section={section}
                data={data}
            />
        ))}

        {/* 5. Release Decision Page */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.headerLogo}>
                        <Text style={styles.headerLogoText}>SL</Text>
                    </View>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleMain}>Final Release</Text>
                        <Text style={styles.headerTitleSub}>Batch {data.header.batchCode}</Text>
                    </View>
                </View>
            </View>

            <SectionTitle title="5. Final Batch Release Decision" />

            <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontStyle: 'italic', color: '#475569', marginBottom: 15 }}>
                    Based on the analytical results presented in this report, the production batch {data.header.batchCode} is:
                </Text>

                <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                    <StatusOption
                        label="RELEASED"
                        selected={data.releaseDecision.status === 'RELEASED'}
                        color="#0f172a"
                    />
                    <StatusOption
                        label="BLOCKED"
                        selected={data.releaseDecision.status === 'BLOCKED'}
                        color="#e11d48"
                    />
                </View>

                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 5 }}>
                        Authorized Release Signature
                    </Text>
                    <SignatureBlock signature={data.releaseDecision.approver} showHash />
                </View>
            </View>

            <View style={styles.pageFooter} fixed>
                <Text style={styles.footerText}>Generated by SmartLab Enterprise. Modification Invalidates Report.</Text>
                <Text style={styles.footerText}>ID: {data.releaseDecision.approver.signatureId || "AUDIT-TRAIL"}</Text>
            </View>
        </Page>
    </Document>
);

const AnalyticsPage = ({ index, title, section, data }: { index: number, title: string, section: AnalyticalSection, data: any }) => (
    <Page size="A4" style={styles.page}>
        {/* Simplified Header for inner pages */}
        <View style={[styles.header, { marginBottom: 10, paddingBottom: 5 }]}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8' }}>{data.header.batchCode}</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8' }}>{title}</Text>
        </View>

        <SectionTitle title={`${index}. ${title}`} />
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 }}>
            Specification: {section.specTitle} {section.specVersion}
        </Text>

        {section.samples.map((sample, sIdx) => (
            <View key={sIdx} style={{ marginBottom: 15, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'black', textTransform: 'uppercase' }}>Sample ID: {sample.sampleId}</Text>
                    <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: 'bold' }}>
                        Date: {new Date(sample.analysisDate).toLocaleDateString()}
                    </Text>
                </View>

                {/* Results Table */}
                <View style={[styles.table, { borderWidth: 0, marginTop: 5 }]}>
                    <View style={[styles.tableHeaderRow, { backgroundColor: '#f8fafc', borderBottomWidth: 0 }]}>
                        <Text style={[styles.th, { width: '30%', padding: 4 }]}>Parameter</Text>
                        <Text style={[styles.th, { width: '15%', padding: 4, textAlign: 'center' }]}>Result</Text>
                        <Text style={[styles.th, { width: '15%', padding: 4, textAlign: 'center' }]}>Limit</Text>
                        <Text style={[styles.th, { width: '10%', padding: 4, textAlign: 'center' }]}>Unit</Text>
                        <Text style={[styles.th, { width: '20%', padding: 4, textAlign: 'center' }]}>Method</Text>
                        <Text style={[styles.th, { width: '10%', padding: 4, textAlign: 'right' }]}>Status</Text>
                    </View>
                    {sample.records.map((r, rIdx) => (
                        <View key={rIdx} style={[styles.tableRow, { borderBottomColor: '#f1f5f9' }]}>
                            <Text style={{ width: '30%', fontSize: 8, padding: 4, fontWeight: 'bold' }}>{r.parameter}</Text>
                            <Text style={{ width: '15%', fontSize: 8, padding: 4, textAlign: 'center', fontWeight: 'black' }}>{r.result}</Text>
                            <Text style={{ width: '15%', fontSize: 8, padding: 4, textAlign: 'center', color: '#64748b' }}>{r.limit}</Text>
                            <Text style={{ width: '10%', fontSize: 8, padding: 4, textAlign: 'center', fontFamily: 'Courier', color: '#94a3b8' }}>{r.unit}</Text>
                            <Text style={{ width: '20%', fontSize: 7, padding: 4, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>{r.method}</Text>
                            <Text style={{ width: '10%', fontSize: 7, padding: 4, textAlign: 'right', fontWeight: 'bold', color: r.status === 'PASS' ? '#059669' : '#e11d48' }}>{r.status}</Text>
                        </View>
                    ))}
                </View>

                {/* Signatures */}
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 2 }}>Analyst</Text>
                        <SignatureBlock signature={sample.analyst} compact />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 2 }}>Reviewer</Text>
                        <SignatureBlock signature={sample.reviewer} compact />
                    </View>
                </View>
            </View>
        ))}

        <View style={styles.pageFooter} fixed>
            <Text style={styles.footerText}>Generated by SmartLab Enterprise.</Text>
            <Text render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} style={styles.footerText} />
        </View>
    </Page>
);

// Helpers
const SectionTitle = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
);

const MetaRow = ({ label, value }: { label: string, value: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
        <Text style={styles.headerMetaLabel}>{label}: </Text>
        <Text style={{ fontSize: 8, marginLeft: 4 }}>{value}</Text>
    </View>
);

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.kvGroup}>
        <Text style={styles.kvLabel}>{label}</Text>
        <Text style={styles.kvValue}>{value}</Text>
    </View>
);

const StatusOption = ({ label, selected, color }: { label: string, selected: boolean, color: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
            width: 16, height: 16,
            borderWidth: 2,
            borderColor: selected ? color : '#e2e8f0',
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
            backgroundColor: selected ? color : 'transparent'
        }}>
            {selected && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}
        </View>
        <Text style={{ fontSize: 10, fontWeight: 'black', textTransform: 'uppercase' }}>{label}</Text>
    </View>
);

const SignatureBlock = ({ signature, compact, showHash }: { signature: Signature, compact?: boolean, showHash?: boolean }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: compact ? 0 : 1, borderColor: '#e2e8f0', padding: compact ? 0 : 8, borderRadius: 6 }}>
        {!compact && <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#0f172a', marginRight: 8 }} />}
        <View>
            <Text style={{ fontSize: compact ? 8 : 9, fontWeight: 'bold', textTransform: 'uppercase' }}>{signature.name}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', minWidth: compact ? 0 : 150 }}>
                <Text style={{ fontSize: compact ? 6 : 7, color: '#94a3b8', fontWeight: 'medium', textTransform: 'uppercase' }}>{signature.role}</Text>
                <Text style={{ fontSize: compact ? 6 : 7, color: '#94a3b8', fontStyle: 'italic', marginLeft: 10 }}>{new Date(signature.date).toLocaleDateString()}</Text>
            </View>
            {showHash && signature.hash && (
                <Text style={{ fontSize: 5, fontFamily: 'Courier', color: '#cbd5e1', marginTop: 2 }}>HASH: {signature.hash}</Text>
            )}
        </View>
    </View>
);
