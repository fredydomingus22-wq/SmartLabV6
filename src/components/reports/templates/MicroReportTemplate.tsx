import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { EnterpriseBatchReportDTO, Signature } from "@/lib/reports/report-dtos";
import { styles as commonStyles } from '../styles';

/**
 * MicroReportTemplate - Microbiological Quality Report
 * 
 * STRICT SEGREGATION: This template ONLY receives and displays 
 * data from the 'microbiological' category. FQ data is never mixed here.
 */

const styles = StyleSheet.create({
    ...commonStyles,
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

interface MicroReportProps {
    data: EnterpriseBatchReportDTO;
}

export const MicroReportTemplate = ({ data }: MicroReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.headerLogo}>
                        <Text style={styles.headerLogoText}>SL</Text>
                    </View>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleMain}>Microbiological Report</Text>
                        <Text style={styles.headerTitleSub}>Batch {data.header.batchCode}</Text>
                    </View>
                </View>
                <View>
                    <Text style={{ fontSize: 8 }}>Product: {data.header.productName}</Text>
                    <Text style={{ fontSize: 8 }}>Plant: {data.header.plantName}</Text>
                </View>
            </View>

            {data.microAnalysis.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b' }}>No microbiological data available for this batch.</Text>
                </View>
            ) : (
                data.microAnalysis.map((section, idx) => (
                    <View key={idx}>
                        <SectionTitle title={section.specTitle || "Microbiological Analysis"} />
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 }}>
                            Specification: {section.specVersion}
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
                    </View>
                ))
            )}

            <View style={styles.pageFooter} fixed>
                <Text style={styles.footerText}>Generated by SmartLab Enterprise.</Text>
                <Text render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} style={styles.footerText} />
            </View>
        </Page>
    </Document>
);

const SectionTitle = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
);

const SignatureBlock = ({ signature, compact }: { signature: Signature, compact?: boolean }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: compact ? 0 : 1, borderColor: '#e2e8f0', padding: compact ? 0 : 8, borderRadius: 6 }}>
        {signature.signatureUrl && (
            <Image src={signature.signatureUrl} style={{ width: 40, height: 20, marginRight: 8 }} />
        )}
        <View>
            <Text style={{ fontSize: compact ? 8 : 9, fontWeight: 'bold', textTransform: 'uppercase' }}>{signature.name}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', minWidth: compact ? 0 : 150 }}>
                <Text style={{ fontSize: compact ? 6 : 7, color: '#94a3b8', fontWeight: 'medium', textTransform: 'uppercase' }}>{signature.role}</Text>
                <Text style={{ fontSize: compact ? 6 : 7, color: '#94a3b8', fontStyle: 'italic', marginLeft: 10 }}>{new Date(signature.date).toLocaleDateString('pt-PT')}</Text>
            </View>
        </View>
    </View>
);
