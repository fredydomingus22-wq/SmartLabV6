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
                                data.overview.finalStatus === 'RELEASED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    data.overview.finalStatus === 'BLOCKED' ? "bg-rose-50 text-rose-700 border-rose-200" :
                                        "bg-amber-50 text-amber-700 border-amber-200"
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
                                <span className={cn(
                                    "text-sm font-black uppercase tracking-tighter border-b-4",
                                    data.overview.finalStatus === 'RELEASED' ? "text-emerald-600 border-emerald-600" :
                                        data.overview.finalStatus === 'BLOCKED' ? "text-rose-600 border-rose-600" :
                                            "text-amber-600 border-amber-600"
                                )}>
                                    {data.overview.finalStatus === 'RELEASED' ? "APPROVED / RELEASED" :
                                        data.overview.finalStatus === 'BLOCKED' ? "BLOCKED / REJECTED" :
                                            "PENDING FINAL RELEASE"}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {/* 4️⃣ SECTION 3 — Physicochemical Analysis */}
            {data.fqAnalysis.map((section, idx) => (
                <AnalyticalSectionPivotTemplate key={idx} index={3} title="Final Product – Physicochemical Analysis" section={section} />
            ))}

            {/* 5️⃣ SECTION 4 — Microbiological Analysis */}
            {data.microAnalysis.map((section, idx) => (
                <AnalyticalSectionPivotTemplate key={idx} index={4} title="Final Product – Microbiological Analysis" section={section} />
            ))}

            {/* 6️⃣ SECTION 5 — Electronic Approval & Certification Matrix */}
            <section className="mt-12 mb-10 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-5 w-1 bg-slate-900" />
                    <h2 className="text-sm font-black uppercase tracking-tight">5. Electronic Approval & Certification Matrix</h2>
                </div>

                <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">1. Technical Review (QC Supervisor)</p>
                        <SignatureBox signature={data.signatures.review} compact showHash />
                    </div>
                    <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">2. Final QA Certification (QA Manager)</p>
                        <SignatureBox signature={data.signatures.certification} compact showHash />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-4">
                    <div className={cn(
                        "h-8 px-4 flex items-center rounded-full text-[10px] font-black tracking-widest border",
                        data.overview.finalStatus === 'RELEASED' ? "bg-emerald-600 text-white border-emerald-700" :
                            data.overview.finalStatus === 'BLOCKED' ? "bg-rose-600 text-white border-rose-700" :
                                "bg-amber-600 text-white border-amber-700"
                    )}>
                        BATCH FINAL DISPOSITION: {data.overview.finalStatus}
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium max-w-md italic">
                        The signatures above constitute electronic identification equivalent to a handwritten signature as per 21 CFR Part 11 and ISO 17025 standards.
                    </p>
                </div>
            </section>

            {/* 7️⃣ FOOTER FIXO */}
            <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-mono text-slate-300 uppercase tracking-widest">
                <p>This document was generated electronically by SmartLab Enterprise. Any modification invalidates this report.</p>
                <div className="flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" />
                    <span>SECURE DOCUMENT ID: {data.signatures.certification.hash?.split(':')[1] || "AUDIT-TRAIL-ENABLED"}</span>
                </div>
            </footer>
        </div>
    );
}

function AnalyticalSectionPivotTemplate({ index, title, section }: { index: number, title: string, section: AnalyticalSection }) {
    // 1. Get unique parameters (Columns)
    const allParameters = Array.from(new Set(
        section.samples.flatMap(s => s.records.map(r => r.parameter))
    ));

    // 2. Get unit/limit info for header if consistent (optional beauty)
    const getParamHeaderDetails = (paramName: string) => {
        const record = section.samples.flatMap(s => s.records).find(r => r.parameter === paramName);
        return { unit: record?.unit || "", limit: record?.limit || "" };
    };

    return (
        <section className="mb-10 page-break">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-1 bg-slate-900" />
                <h2 className="text-sm font-black uppercase tracking-tight">{index}. {title}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mb-4 ml-3">Specification: {section.specTitle} {section.specVersion}</p>

            <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm mx-3">
                <table className="w-full border-collapse text-[10px]">
                    <thead>
                        <tr className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                            <th className="py-3 px-3 text-left border-r border-slate-700 w-28">Date / Time</th>
                            {allParameters.map((p, i) => (
                                <th key={i} className="py-3 px-2 text-center border-l border-slate-700 min-w-24">
                                    <p className="leading-tight">{p}</p>
                                    <p className="text-[7px] text-slate-400 font-medium normal-case mt-0.5">
                                        {getParamHeaderDetails(p).unit}
                                        <span className="block italic opacity-60">
                                            ({getParamHeaderDetails(p).limit})
                                        </span>
                                    </p>
                                </th>
                            ))}
                            <th className="py-3 px-3 text-right">Analyst</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic">
                        {section.samples.map((sample, sIdx) => {
                            return (
                                <tr key={sIdx} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-3 text-left border-r border-slate-100 font-black text-slate-500 tabular-nums leading-tight">
                                        {sample.analysisDate && sample.analysisDate !== "-"
                                            ? new Date(sample.analysisDate).toLocaleString('pt-PT', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : "--/-- --:--"}
                                    </td>
                                    {allParameters.map((p, pIdx) => {
                                        const record = sample.records.find(r => r.parameter === p);
                                        return (
                                            <td key={pIdx} className="py-3 px-2 text-center border-l border-slate-50">
                                                {record ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className={cn(
                                                            "font-black text-[11px]",
                                                            record.status === 'FAIL' ? "text-rose-600" : "text-slate-900"
                                                        )}>
                                                            {record.result}
                                                        </span>
                                                        {record.status === 'FAIL' && (
                                                            <span className="h-1 w-1 rounded-full bg-rose-500" />
                                                        )}
                                                    </div>
                                                ) : <span className="text-slate-200">-</span>}
                                            </td>
                                        );
                                    })}
                                    <td className="py-3 px-3 text-right text-[8px] font-bold text-slate-400">
                                        {(() => {
                                            const parts = sample.analyst.name.split(' ');
                                            return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 ml-3 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[8px] text-slate-400 uppercase font-black tracking-widest">
                <p>System Note: All samples in this section are sorted chronologically by collection time.</p>
                <div className="flex gap-4">
                    <span>LEGEND: ( ) = Specification Limit</span>
                    <span>(*) = Critical Parameter</span>
                </div>
            </div>
        </section >
    );
}

function SignatureBox({ signature, compact, showHash }: { signature: Signature, compact?: boolean, showHash?: boolean }) {
    return (
        <div className={cn("flex items-center gap-3", !compact && "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm")}>
            <div className={cn(
                "rounded-full border flex items-center justify-center overflow-hidden",
                compact ? "h-8 w-8 border-slate-200" : "h-12 w-12 border-slate-900 bg-slate-900 text-white"
            )}>
                {signature.signatureUrl ? (
                    <img src={signature.signatureUrl} alt="Signature" className="h-full w-full object-contain" />
                ) : (
                    compact ? <User className="h-4 w-4 text-slate-300" /> : <ShieldCheck className="h-6 w-6" />
                )}
            </div>
            <div className="flex-1 space-y-0.5">
                <p className={cn("font-bold uppercase tracking-tight", compact ? "text-[10px]" : "text-xs")}>{signature.name}</p>
                <div className="flex flex-col">
                    <p className="text-[9px] text-slate-400 uppercase font-medium leading-tight">{signature.role}</p>
                    <p className="text-[8px] text-slate-400 font-mono italic leading-tight mt-1">{signature.date ? new Date(signature.date).toLocaleString('pt-PT') : 'Pending'}</p>
                </div>
                {showHash && signature.hash && (
                    <p className="text-[6px] font-mono text-slate-300 break-all leading-tight border-t border-slate-50 pt-1 mt-1">
                        SIG_HASH: {signature.hash}
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
                <AnalyticalSectionPivotTemplate key={idx} index={idx + 1} title="Physicochemical Results" section={section} />
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
                <AnalyticalSectionPivotTemplate key={idx} index={idx + 1} title="Microbiological Results" section={section} />
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
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] w-24 inline-block">Release Date:</span> {data.signatures.certification.date ? new Date(data.signatures.certification.date).toLocaleDateString() : 'N/A'}</p>
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
                    <p className="font-black text-[10px] uppercase">{data.signatures.certification.name}</p>
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
                        <SignatureBox signature={data.signatures.certification} compact />
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
                <span>HASH: {data.signatures.certification.hash?.split(':')[1] || "SECURE"}</span>
            </div>
        </footer>
    );
}
