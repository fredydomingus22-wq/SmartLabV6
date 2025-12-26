'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PDFDownloadButtonProps {
    document: React.ReactElement;
    fileName: string;
    label?: string;
}

export const PDFDownloadButton = ({ document, fileName, label = 'Download PDF' }: PDFDownloadButtonProps) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading PDF...
            </Button>
        );
    }

    return (
        <PDFDownloadLink document={document as any} fileName={fileName}>
            {/* @ts-ignore - render props type mismatch often happens with this lib */}
            {({ blob, url, loading, error }) => (
                <Button variant="outline" disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Generating...' : label}
                </Button>
            )}
        </PDFDownloadLink>
    );
};
