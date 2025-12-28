import { createClient } from "@/lib/supabase/server";
import { getPackagingMaterials, getPackagingLots } from "@/lib/queries/packaging";
import { PackagingPageClient } from "./packaging-page-client";
import { PackagingLotsClient } from "./lots/packaging-lots-client";
import { PackagingDialog } from "./packaging-dialog";
import { PackagingLotDialog } from "./lots/packaging-lot-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Layers, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PackagingMaterialsPage() {
    const [materials, lots] = await Promise.all([
        getPackagingMaterials(),
        getPackagingLots()
    ]);

    return (
        <div className="container py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/materials">
                        <Button variant="ghost" size="icon" className="text-slate-400">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                            <Box className="h-8 w-8 text-emerald-400" />
                            Gestão de Embalagem
                        </h1>
                        <p className="text-slate-400 mt-1">Catálogo e lotes de materiais de embalagem.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="catalog" className="space-y-4">
                <TabsList className="bg-slate-900/50 border border-slate-800">
                    <TabsTrigger value="catalog" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        <Box className="h-4 w-4 mr-2" />
                        Catálogo ({materials?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="lots" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        <Layers className="h-4 w-4 mr-2" />
                        Lotes ({lots?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="catalog" className="space-y-4">
                    <div className="flex justify-end">
                        <PackagingDialog />
                    </div>
                    <div className="glass rounded-xl p-6">
                        <PackagingPageClient materials={materials || []} />
                    </div>
                </TabsContent>

                <TabsContent value="lots" className="space-y-4">
                    <div className="flex justify-end">
                        <PackagingLotDialog materials={materials || []} />
                    </div>
                    <div className="glass rounded-xl p-6">
                        <PackagingLotsClient lots={lots || []} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
