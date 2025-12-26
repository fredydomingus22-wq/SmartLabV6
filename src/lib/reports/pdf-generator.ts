import React from "react";
import { EnterpriseBatchReportDTO } from "./report-dtos";
import {
    EnterpriseBatchReportTemplate,
    AnalyticalFQReportTemplate,
    AnalyticalMicroReportTemplate,
    CoAReportTemplate,
    NonConformanceReportTemplate
} from "@/components/reports/templates/official-templates";

/**
 * Generates the full HTML for a report using modern React streaming.
 * This avoids the 'renderToStaticMarkup' which is blocked in App Router.
 */
export async function generateReportHtml(data: EnterpriseBatchReportDTO, type: string) {
    // 0. Use renderToReadableStream (Next.js App Router compliant)
    const { renderToReadableStream } = await import("react-dom/server");

    // 1. Select Template
    let template;
    const reportType = type.toUpperCase();

    switch (reportType) {
        case "FQ":
            template = React.createElement(AnalyticalFQReportTemplate, { data });
            break;
        case "MICRO":
            template = React.createElement(AnalyticalMicroReportTemplate, { data });
            break;
        case "COA":
            template = React.createElement(CoAReportTemplate, { data });
            break;
        case "NC":
            template = React.createElement(NonConformanceReportTemplate, { data });
            break;
        default:
            template = React.createElement(EnterpriseBatchReportTemplate, { data });
    }

    // 2. Render to Stream and convert to Text
    // This allows us to get the HTML string for Puppeteer in a way that handles
    // Server Components/App Router correctly.
    const stream = await renderToReadableStream(template);

    // Wait for the stream to complete and convert to string
    const html = await new Response(stream).text();

    // 3. Wrap in Full HTML Document
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
                    @media print {
                        .page-break { page-break-before: always; }
                        thead { display: table-header-group; }
                    }
                </style>
            </head>
            <body class="bg-white">
                ${html}
            </body>
        </html>
    `;
}
