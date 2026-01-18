"use client";

import React, { useState } from 'react';
import { useUI5Store } from './store';

export function EquipmentMonitorView() {
    const { equipmentHealth } = useUI5Store();
    const [selectedEquip, setSelectedEquip] = useState('EQUIP-FOSS-01');

    const equipment = [
        { id: 'EQUIP-FOSS-01', name: 'FOSS NIRS DS2500', type: 'Infrared Analyzer', status: 'Active', vendor: 'FOSS Analytics' },
        { id: 'EQUIP-THERMO-02', name: 'Thermo Scientific TSQ', type: 'Mass Spectrometer', status: 'Warning', vendor: 'Thermo Fisher' },
        { id: 'EQUIP-AGILENT-03', name: 'Agilent 1260 Infinity', type: 'HPLC System', status: 'Active', vendor: 'Agilent Technologies' },
    ];

    const current = equipment.find(e => e.id === selectedEquip) || equipment[0];

    return (
        <div className="flex h-full overflow-hidden p-4 space-x-4">
            {/* Master List */}
            <ui5-card class="w-[350px] flex-shrink-0 bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <ui5-card-header slot="header" title="Asset Inventory" subtitle="Instrumentation Fleet"></ui5-card-header>
                <ui5-list mode="SingleSelect" class="bg-transparent border-none">
                    {equipment.map(e => (
                        <ui5-li
                            key={e.id}
                            icon="settings"
                            selected={selectedEquip === e.id}
                            additional-text={e.status}
                            onClick={() => setSelectedEquip(e.id)}
                            class="border-b border-light/5"
                        >
                            <div className="flex flex-col py-2">
                                <span className="text-xs font-black text-emerald-400 font-mono">{e.id}</span>
                                <span className="text-sm font-semibold">{e.name}</span>
                            </div>
                        </ui5-li>
                    ))}
                </ui5-list>
            </ui5-card>

            {/* Detail View */}
            <main className="flex-1 flex flex-col bg-slate-800/20 rounded-xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="p-6 bg-slate-900/40 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-3">
                            <ui5-icon name="action-settings" class="text-blue-500"></ui5-icon>
                            <h2 className="text-2xl font-light tracking-tight">{current.name}</h2>
                            <ui5-tag design={current.status === 'Active' ? 'Positive' : 'Critical'}>{current.status}</ui5-tag>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-widest">{current.vendor} | {current.type}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-muted-foreground font-black uppercase">Fleet Health Score</span>
                        <div className="text-3xl font-mono text-emerald-500 font-black leading-none mt-1">
                            {equipmentHealth[current.id]?.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <ui5-tabcontainer class="flex-1" collapsed fixed>
                    <ui5-tab text="Technical Profile" selected icon="detail-view">
                        <div className="p-8 grid grid-cols-2 gap-8 max-w-4xl">
                            <div className="space-y-6">
                                <ui5-title level="H4">Specifications</ui5-title>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <ui5-label>Serial Number</ui5-label>
                                        <span className="font-mono text-xs text-slate-300">SN-2025-FX900</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <ui5-label>Firmware Version</ui5-label>
                                        <span className="font-mono text-xs text-slate-300">v4.52.12-LIMS</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <ui5-label>Last Calibration</ui5-label>
                                        <span className="font-mono text-xs text-amber-500">2026-01-10</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <ui5-title level="H4">Operational Limits</ui5-title>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <ui5-label>Operating Temp</ui5-label>
                                        <span className="font-mono text-xs text-slate-300">18°C - 24°C</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <ui5-label>Max Throughput</ui5-label>
                                        <span className="font-mono text-xs text-slate-300">12 Samples/hr</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ui5-tab>
                    <ui5-tab text="Calibration Logs" icon="history">
                        <div className="p-8">
                            <ui5-timeline>
                                <ui5-timeline-item title-text="Routine Calibration" subtitle-text="2026-01-10" icon="accept" status="Success">
                                    Full standardization protocol against reference NRC-202.
                                </ui5-timeline-item>
                                <ui5-timeline-item title-text="Maintenance Alert" subtitle-text="2025-12-15" icon="alert" status="Warning">
                                    Lamp intensity dropped below 85%. Replacement suggested in Q1.
                                </ui5-timeline-item>
                            </ui5-timeline>
                        </div>
                    </ui5-tab>
                    <ui5-tab text="Performance Metrics" icon="business-objects-experience">
                        <div className="p-8 flex items-center justify-center h-full opacity-30 italic">
                            Advanced Analytics Module Loading...
                        </div>
                    </ui5-tab>
                </ui5-tabcontainer>
            </main>

            <style jsx global>{`
                ui5-tabcontainer::part(content) {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
}
