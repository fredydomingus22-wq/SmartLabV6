import { StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed. For now we use standard fonts.
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf' });

export const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
        borderBottomStyle: 'solid',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 50, // Approximate
        backgroundColor: '#eee', // Placeholder for logo
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyInfo: {
        textAlign: 'right',
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#f0f0f0',
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 100,
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 10,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
    },
    tableCol: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCellHeader: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 10,
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10,
        alignItems: 'center',
    },
    signatureImage: {
        width: 100,
        height: 40,
        marginBottom: 5,
    }
});
