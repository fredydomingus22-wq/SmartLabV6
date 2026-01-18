"use client";

import React, { useState } from 'react';

export function ExecutionWizardView() {
    const [step, setStep] = useState(1);

    return (
        <div className="p-8 h-full overflow-hidden flex flex-col">
            <ui5-wizard class="flex-1 shadow-2xl rounded-2xl overflow-hidden bg-[#12171c]/50 border border-slate-800">
                <ui5-wizard-step title="Sample Reception" icon="product" selected={step === 1} disabled={step < 1}>
                    <div className="flex flex-col space-y-6 p-4 max-w-2xl">
                        <ui5-title level="H3">Register Laboratory Sample</ui5-title>
                        <ui5-label show-colon required>Internal Tracking ID</ui5-label>
                        <ui5-input placeholder="e.g., SMP-2026-X4" style={{ width: "100%" }}></ui5-input>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2">
                                <ui5-label>Source Unit</ui5-label>
                                <ui5-select>
                                    <ui5-option>Production Line A</ui5-option>
                                    <ui5-option>Production Line B</ui5-option>
                                    <ui5-option selected>Main SILO 04</ui5-option>
                                </ui5-select>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <ui5-label>Priority Level</ui5-label>
                                <ui5-tag design="Critical">HIGH PRIORITY</ui5-tag>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-800 mt-auto">
                            <ui5-button design="Emphasized" onClick={() => setStep(2)}>Prepare Analysis</ui5-button>
                        </div>
                    </div>
                </ui5-wizard-step>

                <ui5-wizard-step title="Media Preparation" icon="temperature" selected={step === 2} disabled={step < 2}>
                    <div className="flex flex-col space-y-6 p-4 max-w-2xl">
                        <ui5-title level="H3">Protocol Configuration</ui5-title>
                        <ui5-message-strip design="Warning">Ensure all glassware is autoclaved before proceeding.</ui5-message-strip>

                        <ui5-label>Microbiology Media Type</ui5-label>
                        <ui5-select style={{ width: "100%" }}>
                            <ui5-option>PCA (Plate Count Agar)</ui5-option>
                            <ui5-option>VRBG (Enterobacteriaceae)</ui5-option>
                            <ui5-option>YGC (Yeasts & Moulds)</ui5-option>
                        </ui5-select>

                        <div className="flex items-center space-x-4">
                            <ui5-checkbox text="Standard 48h Incubation" checked></ui5-checkbox>
                            <ui5-checkbox text="Aseptic Manifold Used"></ui5-checkbox>
                        </div>

                        <div className="pt-8 border-t border-slate-800 mt-auto flex space-x-4">
                            <ui5-button design="Transparent" onClick={() => setStep(1)}>Back</ui5-button>
                            <ui5-button design="Emphasized" onClick={() => setStep(3)}>Execute Analysis</ui5-button>
                        </div>
                    </div>
                </ui5-wizard-step>

                <ui5-wizard-step title="Execution" icon="activities" selected={step === 3} disabled={step < 3}>
                    <div className="flex flex-col space-y-6 p-4 max-w-2xl text-center items-center justify-center min-h-[400px]">
                        <ui5-busy-indicator active size="L"></ui5-busy-indicator>
                        <ui5-title level="H4">Waiting for Equipment Sync...</ui5-title>
                        <p className="text-slate-500 text-sm">Synchronizing data from FOSS Infrared Analyzer Model X...</p>
                        <ui5-button design="Transparent" onClick={() => setStep(4)} class="mt-8">Bypass and Enter Manual Data</ui5-button>
                    </div>
                </ui5-wizard-step>

                <ui5-wizard-step title="Validation" icon="signature" selected={step === 4} disabled={step < 4}>
                    <div className="flex flex-col space-y-6 p-4 max-w-4xl">
                        <ui5-title level="H3">Final Operational Review</ui5-title>

                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                            <div className="flex justify-between border-b border-slate-800 pb-2 mb-4">
                                <span className="text-emerald-500 font-black">BATCH TRANSACTION LOG</span>
                                <span>v2.1.0-AUTH</span>
                            </div>
                            <p>RECEIVE [SMP-2026-X4] ... OK</p>
                            <p>MEDIA [VRBG] REF: 992-B ... OK</p>
                            <p>ANALYSIS [GORDURA] RESULT: 14.2% ... OK</p>
                            <div className="pt-4 text-emerald-500 uppercase font-black">Ready for Release Signature</div>
                        </div>

                        <div className="flex space-x-4 pt-8 border-t border-slate-800 mt-auto">
                            <ui5-button design="Transparent" onClick={() => setStep(3)}>Back</ui5-button>
                            <ui5-button design="Positive" icon="accept" style={{ width: "200px" }}>Sign & Release</ui5-button>
                        </div>
                    </div>
                </ui5-wizard-step>
            </ui5-wizard>
        </div>
    );
}
