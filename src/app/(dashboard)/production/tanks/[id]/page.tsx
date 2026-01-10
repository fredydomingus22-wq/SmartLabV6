import { getTankWithContentAction } from "@/app/actions/tanks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TankDialog } from "../_components/tank-dialog";
import { TankDetailsUX } from "./tank-details-ux";

interface PageProps {
    params: Promise<{
        id: string;
    }>
}

export default async function TankDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const result = await getTankWithContentAction(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const tank = result.data;

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-slate-100">
            {/* 🏗️ ENTERPRISE INDUSTRIAL HEADER (Aligned with Reference UI) */}
            <header className="px-8 py-6 border-b border-white/5 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            <Link href="/production/tanks" className="hover:text-blue-400 transition-colors">Monitorização de Tanques</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-blue-500">Detalhes do Ativo</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
                            {tank.currentContent?.batch?.code || tank.name}
                            <span className="text-slate-500 font-mono text-lg font-medium">{tank.code}</span>
                        </h1>
                        <p className="text-[11px] text-slate-400 font-medium">
                            Asset Physical ID: <span className="text-slate-500 font-mono">{tank.id}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <TankDialog tank={tank} trigger={
                            <Button variant="outline" className="h-10 px-4 rounded-lg border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                <Settings2 className="h-3.5 w-3.5 mr-2" /> Configurar Ativo
                            </Button>
                        } />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
                <TankDetailsUX tank={tank} />
            </main>
        </div>
    );
}
