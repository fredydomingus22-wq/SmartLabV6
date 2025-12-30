import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap } from "lucide-react";
import { CreateDocumentDialog } from "./_components/create-document-dialog";
import { DocumentsClient } from "./_components/documents-client";
import { getDocuments, getDocCategories, getPlants } from "@/lib/queries/dms";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const { data: documents } = await getDocuments();
    let { data: categories } = await getDocCategories();
    const { data: plants } = await getPlants();

    // Auto-seed if empty (Rescue logic for new organizations)
    if (categories?.length === 0) {
        const supabase = await createClient();
        const user = await getSafeUser();

        const defaultCategories = [
            { name: 'Standard Operating Procedure', code: 'SOP', description: 'Procedimentos Operacionais Normatizados' },
            { name: 'Analytical Method', code: 'MTD', description: 'Métodos Analíticos de Laboratório' },
            { name: 'Product Specification', code: 'SPC', description: 'Especificações de Matéria-Prima e Produto Final' },
            { name: 'Quality Form', code: 'FRM', description: 'Formulários e Registos de Qualidade' }
        ];

        const { error: seedError } = await supabase.from("doc_categories").insert(
            defaultCategories.map(c => ({ ...c, organization_id: user.organization_id }))
        );

        if (seedError) {
            console.error("DMS Seed failure for org", user.organization_id, seedError);
        } else {
            // Fetch again after seeding
            const secondFetch = await getDocCategories();
            categories = secondFetch.data;
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                        Gestão Documental (DMS)
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Controlo de SOPs, Métodos, Especificações e Formulários normatizados.
                    </p>
                </div>
                <CreateDocumentDialog categories={categories} plants={plants} />
            </div>

            <Tabs defaultValue="documents" className="space-y-6">
                <TabsList className="glass border-slate-800 p-1">
                    <TabsTrigger value="documents" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-2">
                        <FileText className="h-4 w-4" />
                        Documentação (DMS)
                    </TabsTrigger>
                    <TabsTrigger value="training" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Formação & Competências
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="animate-in fade-in duration-500 border-none p-0 outline-none">
                    <DocumentsClient
                        documents={documents}
                        categories={categories}
                        plants={plants}
                    />
                </TabsContent>

                <TabsContent value="training" className="animate-in fade-in duration-500 border-none p-0 outline-none">
                    <div className="glass p-12 rounded-3xl border-none shadow-xl text-center space-y-4">
                        <div className="h-20 w-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                            <GraduationCap className="h-10 w-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Formação & Matriz de Competências</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Registe treinamentos, avalie a eficácia da formação e controle a aptidão dos colaboradores para tarefas críticas.
                        </p>
                        <Link href="/quality/training">
                            <Button className="bg-indigo-600 hover:bg-indigo-500 mt-4">
                                Abrir Módulo de Formação
                            </Button>
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
