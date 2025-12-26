import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, ShieldCheck, User, ClipboardList, Package, Beaker, FileText, Fingerprint } from "lucide-react";
import { EnterpriseBatchReportDTO, AnalyticalSection, Signature } from "@/lib/reports/report-dtos";

/**
 * 🔹 Enterprise Batch Quality Report
 * The "Documento Técnico-Legal" requested by the user.
 */
export function EnterpriseBatchReportTemplate({ data }: { data: EnterpriseBatchReportDTO }) {
    return (
        <div className="report-container font-sans text-slate-900 bg-white">
            {/* CSS for Print - Ensures header repeats and proper page breaks */}
            <style>{`
                @media print {
                    @page { margin: 20mm; }
                    .report-container { width: 100%; border: none !important; }
                    .page-break { page-break-before: always; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
                .report-header-sticky { position: sticky; top: 0; background: white; z-index: 100; border-bottom: 2px solid #0f172a; }
            `}</style>

            {/* 1️⃣ HEADER FIXO */}
            <header className="report-header-sticky flex justify-between items-end pb-4 mb-8">
                <div className="flex gap-4 items-center">
                    <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center rounded-lg font-black italic">SL</div>
                    <div className="space-y-0.5">
                        <p className="text-sm font-black tracking-tighter uppercase text-slate-900 leading-none">SmartLab Enterprise</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Digital Quality Assurance</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[9px] text-right">
                    <p><span className="text-slate-400 font-bold uppercase">Production Plant:</span> {data.header.plantName}</p>
                    <p><span className="text-slate-400 font-bold uppercase">Document Type:</span> Batch Quality Report</p>
                    <p><span className="text-slate-400 font-bold uppercase">Product:</span> {data.header.productName}</p>
                    <p><span className="text-slate-400 font-bold uppercase">Batch Code:</span> {data.header.batchCode}</p>
                    <p><span className="text-slate-400 font-bold uppercase">Report ID:</span> {data.header.reportId}</p>
                    <p className="font-bold text-slate-900">Page 1 of 1</p>
                </div>
            </header>

            {/* 2️⃣ SECTION 1 — Batch Overview */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 bg-slate-900" />
                    <h2 className="text-sm font-black uppercase tracking-tight">1. Batch Overview</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6">
                    <div className="space-y-2 text-xs">
                        <p><span className="font-bold text-slate-400 uppercase text-[10px] w-32 inline-block">Product Name:</span> {data.overview.productName}</p>
                        <p><span className="font-bold text-slate-400 uppercase text-[10px] w-32 inline-block">Batch Code:</span> {data.overview.batchCode}</p>
                        <p><span className="font-bold text-slate-400 uppercase text-[10px] w-32 inline-block">Production Period:</span> {data.overview.productionPeriod}</p>
                    </div>
                    <div className="space-y-2 text-xs">
                        <p><span className="font-bold text-slate-400 uppercase text-[10px] w-32 inline-block">Planned Quantity:</span> {data.overview.plannedQuantity.toLocaleString()} units</p>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 uppercase text-[10px] w-32 inline-block">Final Batch Status:</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black tracking-widest border",
                                data.overview.finalStatus === 'RELEASED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                                {data.overview.finalStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3️⃣ SECTION 2 — Quality Summary */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 bg-slate-900" />
                    <h2 className="text-sm font-black uppercase tracking-tight">2. Quality Summary</h2>
                </div>
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-900 text-left">
                            <th className="py-2 font-bold uppercase text-[10px] text-slate-400">Discipline</th>
                            <th className="py-2 font-bold uppercase text-[10px] text-slate-400 text-center">Samples</th>
                            <th className="py-2 font-bold uppercase text-[10px] text-slate-400 text-center text-emerald-600">Approved</th>
                            <th className="py-2 font-bold uppercase text-[10px] text-slate-400 text-center text-rose-500">Rejected</th>
                            <th className="py-2 font-bold uppercase text-[10px] text-slate-400 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.qualitySummary.map((q, idx) => (
                            <tr key={idx}>
                                <td className="py-3 font-bold">{q.discipline}</td>
                                <td className="py-3 text-center">{q.samples}</td>
                                <td className="py-3 text-center font-bold text-emerald-600">{q.approved}</td>
                                <td className="py-3 text-center font-bold text-rose-500">{q.rejected}</td>
                                <td className="py-3 text-right">
                                    <div className={cn(
                                        "flex items-center justify-end gap-1.5 font-black text-[9px] uppercase tracking-widest",
                                        q.status === 'APPROVED' ? "text-emerald-600" : "text-amber-500"
                                    )}>
                                        {q.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                        {q.status}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-100">
                            <td colSpan={5} className="py-4 text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mr-3">Overall Quality Status:</span>
                                <span className="text-sm font-black uppercase tracking-tighter text-slate-900 border-b-4 border-slate-900">
                                    {data.overview.finalStatus === 'RELEASED' ? "APPROVED" : "BLOCKED"}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {/* 4️⃣ SECTION 3 — Physicochemical Analysis */}
            {data.fqAnalysis.map((section, idx) => (
                <AnalyticalSectionTemplate key={idx} index={3} title="Final Product – Physicochemical Analysis" section={section} />
            ))}

            {/* 5️⃣ SECTION 4 — Microbiological Analysis */}
            {data.microAnalysis.map((section, idx) => (
                <AnalyticalSectionTemplate key={idx} index={4} title="Final Product – Microbiological Analysis" section={section} />
            ))}

            {/* 6️⃣ SECTION 5 — Final Batch Release */}
            <section className="mt-12 mb-10 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-5 w-1 bg-slate-900" />
                    <h2 className="text-sm font-black uppercase tracking-tight">5. Final Batch Release Decision</h2>
                </div>

                <div className="grid grid-cols-2 gap-12 items-end">
                    <div className="space-y-6">
                        <p className="text-xs text-slate-600 italic">Based on the analytical results presented in this report, the production batch {data.header.batchCode} is:</p>
                        <div className="flex gap-8">
                            <div className="flex items-center gap-3">
                                <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center", data.releaseDecision.status === 'RELEASED' ? "bg-slate-900 border-slate-900" : "border-slate-200")}>
                                    {data.releaseDecision.status === 'RELEASED' && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900">RELEASED</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center", data.releaseDecision.status === 'BLOCKED' ? "bg-rose-600 border-rose-600" : "border-slate-200")}>
                                    {data.releaseDecision.status === 'BLOCKED' && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900">BLOCKED</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Release Signature</p>
                        <SignatureBox signature={data.releaseDecision.approver} showHash />
                    </div>
                </div>
            </section>

            {/* 7️⃣ FOOTER FIXO */}
            <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-mono text-slate-300 uppercase tracking-widest">
                <p>This document was generated electronically by SmartLab Enterprise. Any modification invalidates this report.</p>
                <div className="flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" />
                    <span>SECURE DOCUMENT ID: {data.releaseDecision.approver.signatureId || "AUDIT-TRAIL-ENABLED"}</span>
                </div>
            </footer>
        </div>
    );
}

function AnalyticalSectionTemplate({ index, title, section }: { index: number, title: string, section: AnalyticalSection }) {
    return (
        <section className="mb-10 page-break">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-1 bg-slate-900" />
                <h2 className="text-sm font-black uppercase tracking-tight">{index}. {title}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mb-4 ml-3">Specification: {section.specTitle} {section.specVersion}</p>

            {section.samples.map((sample, sIdx) => (
                <div key={sIdx} className="mb-8 pl-3 border-l-2 border-slate-50 space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                        <div className="text-[11px] font-black uppercase tracking-tighter">Sample ID: <span className="text-slate-500 font-mono tracking-normal">{sample.sampleId}</span></div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Analysis Date: {new Date(sample.analysisDate).toLocaleDateString()}</div>
                    </div>

                    <table className="w-full border-collapse text-[11px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest text-left">
                                <th className="py-2 px-3">Parameter</th>
                                <th className="py-2 px-3 text-center">Result</th>
                                <th className="py-2 px-3 text-center">Spec Limit</th>
                                <th className="py-2 px-3 text-center">Unit</th>
                                <th className="py-2 px-3 text-center">Method</th>
                                <th className="py-2 px-3 text-center">Critical</th>
                                <th className="py-2 px-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 border-b border-slate-100">
                            {sample.records.map((r, rIdx) => (
                                <tr key={rIdx} className="group">
                                    <td className="py-2.5 px-3 font-bold text-slate-700">{r.parameter}</td>
                                    <td className="py-2.5 px-3 text-center font-black">{r.result}</td>
                                    <td className="py-2.5 px-3 text-center text-slate-500">{r.limit}</td>
                                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{r.unit}</td>
                                    <td className="py-2.5 px-3 text-center text-slate-400 italic text-[9px]">{r.method}</td>
                                    <td className="py-2.5 px-3 text-center">
                                        {r.isCritical && <span className="h-2 w-2 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-200" />}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                        <span className={cn(
                                            "text-[8px] font-black px-1.5 py-0.5 rounded",
                                            r.status === 'PASS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="space-y-3">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Analysed by:</p>
                            <SignatureBox signature={sample.analyst} compact />
                        </div>
                        <div className="space-y-3">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Reviewed by:</p>
                            <SignatureBox signature={sample.reviewer} compact />
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}

function SignatureBox({ signature, compact, showHash }: { signature: Signature, compact?: boolean, showHash?: boolean }) {
    return (
        <div className={cn("flex items-center gap-3", !compact && "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm")}>
            <div className={cn(
                "rounded-full border flex items-center justify-center",
                compact ? "h-6 w-6 border-slate-200" : "h-10 w-10 border-slate-900 bg-slate-900 text-white"
            )}>
                {compact ? <User className="h-3 w-3 text-slate-300" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div className="flex-1 space-y-0.5">
                <p className={cn("font-bold uppercase tracking-tight", compact ? "text-[10px]" : "text-xs")}>{signature.name}</p>
                <div className="flex items-center justify-between">
                    <p className="text-[9px] text-slate-400 uppercase font-medium">{signature.role}</p>
                    <p className="text-[9px] text-slate-400 font-mono italic">{new Date(signature.date).toLocaleString()}</p>
                </div>
                {showHash && signature.hash && (
                    <p className="text-[7px] font-mono text-slate-300 break-all leading-tight border-t border-slate-50 pt-1 mt-1">
                        SECURE_SIG_HASH: {signature.hash}
                    </p>
                )}
            </div>
        </div>
    );
}

// 🔹 STANDALONE TEMPLATES (R2, R3, R5, R6)

/**
 * R2 - Analytical Physicochemical Report
 */
export function AnalyticalFQReportTemplate({ data }: { data: EnterpriseBatchReportDTO }) {
    return (
        <div className="report-container font-sans text-slate-900 bg-white">
            <ReportHeader data={data} title="Analytical Physicochemical Report (R2)" />
            {data.fqAnalysis.map((section, idx) => (
                <AnalyticalSectionTemplate key={idx} index={1} title="Physicochemical Results" section={section} />
            ))}
            <ComplianceFooter data={data} />
        </div>
    );
}

/**
 * R3 - Analytical Microbiological Report
 */
export function AnalyticalMicroReportTemplate({ data }: { data: EnterpriseBatchReportDTO }) {
    return (
        <div className="report-container font-sans text-slate-900 bg-white">
            <ReportHeader data={data} title="Analytical Microbiological Report (R3)" />
            {data.microAnalysis.map((section, idx) => (
                <AnalyticalSectionTemplate key={idx} index={1} title="Microbiological Results" section={section} />
            ))}
            <ComplianceFooter data={data} />
        </div>
    );
}

/**
 * R5 - Certificate of Analysis (CoA)
 * Summarized view for external customers.
 */
export function CoAReportTemplate({ data }: { data: EnterpriseBatchReportDTO }) {
    // Flatten result for CoA
    const allAnalyses = [...data.fqAnalysis, ...data.microAnalysis];

    return (
        <div className="report-container font-sans text-slate-900 bg-white border-[10px] border-slate-50 p-4">
            <ReportHeader data={data} title="Certificate of Analysis (CoA)" />

            <section className="mb-8 bg-slate-50 p-6 rounded-2xl grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-2">
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">Product:</span> {data.header.productName}</p>
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">Batch:</span> {data.header.batchCode}</p>
                </div>
                <div className="space-y-2">
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">Status:</span>
                        <span className="ml-2 font-black text-emerald-600">CERTIFIED CONFORM</span>
                    </p>
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">Release Date:</span> {new Date(data.releaseDecision.approver.date).toLocaleDateString()}</p>
                </div>
            </section>

            <table className="w-full border-collapse text-xs mb-10">
                <thead>
                    <tr className="border-b-2 border-slate-900 text-left">
                        <th className="py-2 font-black uppercase tracking-tight">Parameter</th>
                        <th className="py-2 text-center font-black uppercase tracking-tight">Specification</th>
                        <th className="py-2 text-center font-black uppercase tracking-tight">Result</th>
                        <th className="py-2 text-right font-black uppercase tracking-tight">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {allAnalyses.flatMap(section => section.samples.flatMap(sample => sample.records)).map((r, i) => (
                        <tr key={i}>
                            <td className="py-3 font-bold">{r.parameter}</td>
                            <td className="py-3 text-center text-slate-500">{r.limit} {r.unit}</td>
                            <td className="py-3 text-center font-black">{r.result}</td>
                            <td className="py-3 text-right">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black text-[9px]">PASS</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-12 border-t pt-8 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 max-w-sm italic">
                    This certificate confirms that the mentioned batch was inspected and conforms to the product quality specifications.
                </div>
                <div className="w-64 text-center">
                    <div className="h-1 bg-slate-900 mb-2" />
                    <p className="font-black text-[10px] uppercase">{data.releaseDecision.approver.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Authorized Release Signature</p>
                </div>
            </div>
            <ComplianceFooter data={data} />
        </div>
    );
}

/**
 * 🔹 REUSABLE SUB-COMPONENTS
 */

/**
 * R6 - Non-Conformance Report
 */
export function NonConformanceReportTemplate({ data }: { data: EnterpriseBatchReportDTO }) {
    const hasRejected = data.qualitySummary.some(q => q.rejected > 0);

    return (
        <div className="report-container font-sans text-slate-900 bg-white border-t-[12px] border-rose-600">
            <ReportHeader data={data} title="Non-Conformance Report (R6)" />

            <section className="mb-10 bg-rose-50 p-8 rounded-3xl border border-rose-100">
                <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="h-6 w-6 text-rose-600" />
                    <h2 className="text-lg font-black uppercase tracking-tight text-rose-900">Non-Conformance Detected</h2>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                    Critical quality deviation identified for production batch <span className="font-black underline">{data.header.batchCode}</span>.
                    Immediate quarantine or rejection required based on the following analytical failures:
                </p>
            </section>

            <div className="space-y-6">
                {data.qualitySummary.filter(q => q.rejected > 0).map((q, i) => (
                    <div key={i} className="p-4 border border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Failed Discipline</p>
                        <p className="text-sm font-bold">{q.discipline}</p>
                        <p className="text-xs text-rose-600 mt-1 font-bold">{q.rejected} Analytical failures confirmed.</p>
                    </div>
                ))}
            </div>

            <section className="mt-12 space-y-8">
                <div className="h-px bg-slate-100" />
                <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">Corrective Action Required</p>
                        <div className="h-24 w-full border border-dashed border-slate-200 rounded-xl" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">Quality Manager Disposal</p>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-4 w-4 rounded-full border-2 border-slate-900" />
                            <span className="text-[10px] font-black uppercase">QUARANTINE</span>
                            <div className="h-4 w-4 rounded-full border-2 border-slate-900 ml-4" />
                            <span className="text-[10px] font-black uppercase">REJECT/WASTE</span>
                        </div>
                        <SignatureBox signature={data.releaseDecision.approver} compact />
                    </div>
                </div>
            </section>

            <ComplianceFooter data={data} />
        </div>
    );
}

function ReportHeader({ data, title }: { data: EnterpriseBatchReportDTO, title: string }) {
    return (
        <header className="report-header-sticky flex justify-between items-end pb-4 mb-8">
            <div className="flex gap-4 items-center">
                <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center rounded-lg font-black italic">SL</div>
                <div className="space-y-0.5">
                    <p className="text-sm font-black tracking-tighter uppercase text-slate-900 leading-none">SmartLab Enterprise</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Digital Quality Assurance</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[9px] text-right">
                <p><span className="text-slate-400 font-bold uppercase">Plant:</span> {data.header.plantName}</p>
                <p><span className="text-slate-400 font-bold uppercase">Doc:</span> {title}</p>
                <p><span className="text-slate-400 font-bold uppercase">Batch:</span> {data.header.batchCode}</p>
                <p><span className="text-slate-400 font-bold uppercase">ID:</span> {data.header.reportId}</p>
            </div>
        </header>
    );
}

function ComplianceFooter({ data }: { data: EnterpriseBatchReportDTO }) {
    return (
        <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-mono text-slate-300 uppercase tracking-widest">
            <p>Generated electronically by SmartLab Engine. Standard Compliance ISO 9001/FSSC 22000.</p>
            <div className="flex items-center gap-2 text-right">
                <Fingerprint className="h-3 w-3" />
                <span>HASH: {data.releaseDecision.approver.hash?.split(':')[1] || "SECURE"}</span>
            </div>
        </footer>
    );
}
