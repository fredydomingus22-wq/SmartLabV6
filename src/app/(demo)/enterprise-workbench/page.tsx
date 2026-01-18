"use client";

import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useUI5Store } from './store';
import { AnalyticalGridView } from './analytical-grid-view';
import { ExecutionWizardView } from './execution-wizard-view';
import { EquipmentMonitorView } from './equipment-monitor-view';

export default function EnterpriseWorkbenchDemo() {
    const { activeView, setActiveView, isSidebarCollapsed, toggleSidebar, toasts, removeToast } = useUI5Store();

    return (
        <div className="h-screen w-full flex flex-col bg-background">
            <ui5-shellbar
                primary-title="SmartLab Enterprise"
                secondary-title="Workbench Industrial (Demo)"
                show-notifications
            >
                <ui5-button icon="menu" slot="startButton" onClick={toggleSidebar}></ui5-button>
                <ui5-avatar slot="profile" icon="employee" shape="Circle" class="bg-primary text-primary-foreground"></ui5-avatar>
            </ui5-shellbar>

            <div className="flex flex-1 overflow-hidden">
                <ui5-side-navigation collapsed={isSidebarCollapsed ? true : undefined}>
                    <ui5-side-navigation-item
                        text="Overview"
                        icon="home"
                        selected={activeView === 'overview' || undefined}
                        onClick={() => setActiveView('overview')}
                    ></ui5-side-navigation-item>

                    <ui5-side-navigation-item
                        text="Execução Analítica"
                        icon="lab"
                        expanded
                    >
                        <ui5-side-navigation-sub-item
                            text="Resultados (Grid)"
                            icon="table-view"
                            selected={activeView === 'analytical-grid' || undefined}
                            onClick={() => setActiveView('analytical-grid')}
                        ></ui5-side-navigation-sub-item>
                        <ui5-side-navigation-sub-item
                            text="Wizard de Ensaio"
                            icon="stethoscope"
                            selected={activeView === 'execution-wizard' || undefined}
                            onClick={() => setActiveView('execution-wizard')}
                        ></ui5-side-navigation-sub-item>
                    </ui5-side-navigation-item>

                    <ui5-side-navigation-item
                        text="Equipamentos"
                        icon="machine"
                        selected={activeView === 'equipment-monitor' || undefined}
                        onClick={() => setActiveView('equipment-monitor')}
                    ></ui5-side-navigation-item>

                    <ui5-side-navigation-group text="Admin" class="mt-auto">
                        <ui5-side-navigation-item text="Settings" icon="action-settings"></ui5-side-navigation-item>
                    </ui5-side-navigation-group>
                </ui5-side-navigation>

                <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
                    <ui5-dynamic-page class="h-full w-full" header-snapped-on-scroll>
                        <ui5-dynamic-page-title slot="titleArea">
                            <ui5-breadcrumbs slot="breadcrumbs">
                                <ui5-breadcrumbs-item>SmartLab</ui5-breadcrumbs-item>
                                <ui5-breadcrumbs-item>Workbench</ui5-breadcrumbs-item>
                                <ui5-breadcrumbs-item>Demo</ui5-breadcrumbs-item>
                            </ui5-breadcrumbs>
                            <div slot="heading" className="flex items-center">
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    {activeView === 'overview' && 'Visão Geral'}
                                    {activeView === 'analytical-grid' && 'Raw Data Entry (LIMS)'}
                                    {activeView === 'execution-wizard' && 'Protocolo de Análise'}
                                    {activeView === 'equipment-monitor' && 'Monitorização de Ativos'}
                                </h1>
                            </div>
                            <div slot="actions">
                                <ui5-button design="Emphasized" icon="add">Novo Lote</ui5-button>
                                <ui5-button design="Transparent" icon="action-settings"></ui5-button>
                            </div>
                        </ui5-dynamic-page-title>

                        <ui5-dynamic-page-header slot="headerArea">
                            <div className="flex items-center justify-between w-full px-4 py-2">
                                <ui5-message-strip design="Information" hide-close-button class="w-full">
                                    Ambiente de Demonstração (v2.0.0-alpha) - Dados fictícios.
                                </ui5-message-strip>
                            </div>
                        </ui5-dynamic-page-header>

                        <div className="h-full w-full p-0">
                            {activeView === 'overview' && (
                                <div className="p-8 flex items-center justify-center h-full text-muted-foreground flex-col">
                                    <ui5-icon name="laptop" class="text-6xl mb-4 text-slate-700"></ui5-icon>
                                    <p>Selecione uma ferramenta no menu lateral.</p>
                                </div>
                            )}
                            {activeView === 'analytical-grid' && <AnalyticalGridView />}
                            {activeView === 'execution-wizard' && <ExecutionWizardView />}
                            {activeView === 'equipment-monitor' && <EquipmentMonitorView />}
                        </div>

                        <div slot="footer" className="p-2 bg-slate-900 border-t border-slate-800">
                            <ui5-bar design="FloatingFooter">
                                <ui5-button design="Positive" slot="endContent">Finalizar Turno</ui5-button>
                            </ui5-bar>
                        </div>
                    </ui5-dynamic-page>
                </main>
            </div>
            {toasts.map(toast => (
                <ui5-toast id={`toast-${toast.id}`} key={toast.id} duration={toast.duration} placement="BottomEnd" onClose={() => removeToast(toast.id)}>
                    {toast.message}
                </ui5-toast>
            ))}

            <style jsx global>{`
                ui5-shellbar {
                    background: #12171c;
                    border-bottom: 1px solid #1c2228;
                }
                ui5-side-navigation {
                    background: #12171c;
                }
                ui5-dynamic-page {
                    --_ui5_dynamic_page_header_background: #0f172a;
                    --_ui5_dynamic_page_title_background: #0f172a;
                }
            `}</style>
        </div>
    );
}
