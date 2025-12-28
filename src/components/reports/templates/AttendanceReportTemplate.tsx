import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { styles } from '../styles';

interface AttendanceEntry {
    full_name: string;
    employee_id: string;
    status: 'present' | 'late' | 'absent';
    check_in?: string;
    notes?: string;
}

interface AttendanceReportProps {
    date: string;
    teamName: string;
    shiftName: string;
    entries: AttendanceEntry[];
    organization: {
        name: string;
        address: string;
    };
    supervisorName?: string;
}

export const AttendanceReportTemplate = ({
    date,
    teamName,
    shiftName,
    entries,
    organization,
    supervisorName
}: AttendanceReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logo}>
                    <Text>SmartLab</Text>
                </View>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{organization.name}</Text>
                    <Text>{organization.address}</Text>
                </View>
            </View>

            <Text style={styles.title}>Lista de Presença Diária</Text>

            {/* Report Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações Industriais</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Data:</Text>
                    <Text style={styles.value}>{date}</Text>
                    <Text style={styles.label}>Equipa:</Text>
                    <Text style={styles.value}>{teamName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Turno:</Text>
                    <Text style={styles.value}>{shiftName}</Text>
                    <Text style={styles.label}>Supervisor:</Text>
                    <Text style={styles.value}>{supervisorName || 'N/A'}</Text>
                </View>
            </View>

            {/* Attendance Table */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Registo de Assiduidade</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColHeader, { width: '40%' }]}>
                            <Text style={styles.tableCellHeader}>Funcionário</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '20%' }]}>
                            <Text style={styles.tableCellHeader}>ID</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '20%' }]}>
                            <Text style={styles.tableCellHeader}>Estado</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '20%' }]}>
                            <Text style={styles.tableCellHeader}>Hora</Text>
                        </View>
                    </View>

                    {entries.map((entry, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={[styles.tableCol, { width: '40%' }]}>
                                <Text style={styles.tableCell}>{entry.full_name}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '20%' }]}>
                                <Text style={styles.tableCell}>{entry.employee_id}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '20%' }]}>
                                <Text style={[
                                    styles.tableCell,
                                    entry.status === 'absent' ? { color: 'red' } :
                                        entry.status === 'late' ? { color: 'orange' } :
                                            { color: 'green' }
                                ]}>
                                    {entry.status.toUpperCase()}
                                </Text>
                            </View>
                            <View style={[styles.tableCol, { width: '20%' }]}>
                                <Text style={styles.tableCell}>
                                    {entry.check_in ? new Date(entry.check_in).toLocaleTimeString() : '--:--'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Attendance Summary */}
            <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Resumo:</Text>
                <Text style={{ fontSize: 9 }}>
                    Presentes: {entries.filter(e => e.status === 'present').length} |
                    Atrasos: {entries.filter(e => e.status === 'late').length} |
                    Faltas: {entries.filter(e => e.status === 'absent').length}
                </Text>
            </View>

            {/* Signature */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text>Assinatura do Supervisor:</Text>
                    <Text style={{ marginTop: 20, fontWeight: 'bold' }}>{supervisorName || '________________'}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Gerado automaticamente por SmartLab Enterprise QMS. Página 1 de 1</Text>
            </View>
        </Page>
    </Document>
);
