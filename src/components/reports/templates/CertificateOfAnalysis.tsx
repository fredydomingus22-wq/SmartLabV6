import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { styles } from '../styles';

// Define loose types for the props to avoid strict dependency chains for now
// We can refine these with actual DB types later
interface AnalysisResult {
    parameter_name: string;
    method_name?: string;
    result: string;
    unit: string;
    min_limit?: string | number;
    max_limit?: string | number;
    status: 'pending' | 'compliant' | 'non_compliant';
    instrument?: string;
    min_limit_display?: string;
    max_limit_display?: string;
}

interface SampleData {
    id: string;
    sample_code: string;
    product_name: string;
    batch_code: string;
    collection_date: string;
    client_name?: string;
    description?: string;
}

interface OrganizationData {
    name: string;
    address: string;
    logoUrl?: string;
}

interface CoATemplateProps {
    sample: SampleData;
    analyses: AnalysisResult[];
    organization: OrganizationData;
    plant?: {
        name: string;
        code: string;
        address?: string;
    };
    approver?: {
        name: string;
        role: string;
        signatureUrl?: string; // URL or base64
        signedAt?: string; // ISO timestamp
    };
}

export const CertificateOfAnalysis = ({ sample, analyses, organization, plant, approver }: CoATemplateProps) => (
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
                    <Text style={styles.companyName}>{plant?.name || organization.name}</Text>
                    <Text style={{ fontSize: 9 }}>{organization.name}</Text>
                    {plant?.address && <Text style={{ fontSize: 8 }}>{plant.address}</Text>}
                </View>
            </View>

            <Text style={styles.title}>Certificate of Analysis</Text>

            {/* Sample Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sample Information</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Sample Code:</Text>
                    <Text style={styles.value}>{sample.sample_code}</Text>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>{sample.collection_date}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Product:</Text>
                    <Text style={styles.value}>{sample.product_name}</Text>
                    <Text style={styles.label}>Batch:</Text>
                    <Text style={styles.value}>{sample.batch_code}</Text>
                </View>
                {sample.client_name && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Client:</Text>
                        <Text style={styles.value}>{sample.client_name}</Text>
                    </View>
                )}
            </View>

            {/* Results Table */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Analysis Results</Text>
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColHeader, { width: '30%' }]}>
                            <Text style={styles.tableCellHeader}>Parameter</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '20%' }]}>
                            <Text style={styles.tableCellHeader}>Method</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '20%' }]}>
                            <Text style={styles.tableCellHeader}>Specification</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '15%' }]}>
                            <Text style={styles.tableCellHeader}>Result</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '15%' }]}>
                            <Text style={styles.tableCellHeader}>Status</Text>
                        </View>
                    </View>

                    {/* Table Body */}
                    {analyses.map((analysis, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={[styles.tableCol, { width: '30%' }]}>
                                <Text style={styles.tableCell}>{analysis.parameter_name}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '20%' }]}>
                                <Text style={styles.tableCell}>{analysis.method_name || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '20%' }]}>
                                <Text style={styles.tableCell}>
                                    {analysis.min_limit && analysis.max_limit
                                        ? `${analysis.min_limit} - ${analysis.max_limit}`
                                        : analysis.min_limit ? `>= ${analysis.min_limit}`
                                            : analysis.max_limit ? `<= ${analysis.max_limit}`
                                                : '-'} {analysis.unit}
                                </Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{analysis.result} {analysis.unit}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{analysis.status}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Signatures */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text>Liberado Por:</Text>
                    {approver?.signatureUrl && (
                        <Image src={approver.signatureUrl} style={styles.signatureImage} />
                    )}
                    <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{approver?.name || '________________'}</Text>
                    <Text style={{ fontSize: 9 }}>{approver?.role || 'Quality Manager'}</Text>
                    {approver?.signedAt && (
                        <Text style={{ fontSize: 8, marginTop: 2 }}>{new Date(approver.signedAt).toLocaleString('pt-PT')}</Text>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>This report is electronically generated and valid without a manual signature. {organization.name} - {organization.address}</Text>
                <Text>CONFIDENTIAL DOCUMENT</Text>
            </View>

        </Page>
    </Document>
);
