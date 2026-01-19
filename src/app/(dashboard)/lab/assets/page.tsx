import { FlaskConical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/defaults/page-shell";
import { AssetDialog } from "./_components/create-asset-dialog";
import {
    getLabAssets,
    getPlants
} from "@/lib/queries/lab";
import { LabAssetsClient } from "./lab-assets-client";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Equipamentos de Laboratório',
};

export const dynamic = "force-dynamic";

export default async function LabAssetsPage() {
    const [assets, plants] = await Promise.all([
        getLabAssets(),
        getPlants()
    ]);

    return (
        <PageShell className="pb-20">
            <PageHeader
                variant="emerald"
                icon={<FlaskConical className="h-4 w-4" />}
                overline="Gestão de Ativos & Conformidade ISO 17025"
                title="Instrumentos de Laboratório"
                description="Monitorização de calibrações e manutenção dos equipamentos "
                backHref="/lab"
                collapsible
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/lab/equipment/routine-checks">
                            <Button variant="ghost" className="h-9 hover:bg-emerald-500/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all border border-white/5">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Verificações Diárias
                            </Button>
                        </Link>
                        <AssetDialog plants={plants} />
                    </div>
                }
            />

            <LabAssetsClient assets={assets} plants={plants} />
        </PageShell>
    );
}
