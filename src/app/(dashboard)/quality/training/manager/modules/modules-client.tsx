"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTrainingModule } from "@/app/actions/quality/training-authoring";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { ManagerTabs } from "../manager-tabs";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

// Schema for client
const formSchema = z.object({
    title: z.string().min(3, "Title too short"),
    description: z.string().optional(),
    type: z.enum(['document', 'video', 'quiz', 'external']),
    content_url: z.string().optional(),
    duration_minutes: z.coerce.number().min(1)
});

interface Module {
    id: string;
    title: string;
    description: string | null;
    type: 'document' | 'video' | 'quiz' | 'external';
    duration_minutes: number;
    content_url?: string;
    created_at: string;
}

export function ModulesClient({ modules }: { modules: Module[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            type: "document",
            duration_minutes: 30
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const result = await createTrainingModule(values);

        startTransition(() => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Module created successfully");
                setOpen(false);
                form.reset();
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                variant="blue"
                icon={<GraduationCap className="h-4 w-4" />}
                overline="LIMS Academy Control"
                title="Gestor de Treinamentos"
                description="Crie e gerencie módulos de qualificação para a equipe."
                backHref="/quality"
                actions={
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-6 h-11 shadow-[0_0_20px_rgba(37,99,235,0.2)] border-0">
                                <Plus className="w-4 h-4" /> Novo Módulo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-black/90 border-white/10 backdrop-blur-2xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black tracking-tight">Criar Módulo Academy</DialogTitle>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Configuração de Protocolo de Qualificação</p>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Título do Módulo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Boas Práticas de Fabricação (GMP)" {...field} className="bg-white/5 border-white/10 focus:border-blue-500/50 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Tipo de Conteúdo</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 h-11">
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-slate-900 border-white/10">
                                                            <SelectItem value="document">Documento (PDF)</SelectItem>
                                                            <SelectItem value="video">Vídeo Aula</SelectItem>
                                                            <SelectItem value="quiz">Avaliação (Quiz)</SelectItem>
                                                            <SelectItem value="external">Link Externo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="duration_minutes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Duração (min)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="bg-white/5 border-white/10 h-11" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="content_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Caminho / URL do Conteúdo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="storage/path/to/file.pdf ou http://..." {...field} className="bg-white/5 border-white/10 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-500 h-12 font-black uppercase text-xs tracking-widest mt-4">
                                        {isPending ? "Processando..." : "Finalizar Criação"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <ManagerTabs />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <Link href={`/quality/training/manager/modules/${module.id}`} key={module.id} className="block group">
                        <GlassCard className="p-6 transition-all hover:bg-white/[0.04] border-white/5 hover:border-blue-500/30 relative overflow-hidden flex flex-col justify-between h-full">
                            <div className="absolute top-0 right-0 p-3">
                                <div className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                    {module.type}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors mb-2 pr-12 leading-tight">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 font-medium mb-4">
                                    {module.description || "Sem descrição disponível para este módulo."}
                                </p>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{module.duration_minutes} min</span>
                                </div>
                                {module.type === 'quiz' && (
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Editor de Questões
                                    </span>
                                )}
                            </div>
                        </GlassCard>
                    </Link>
                ))}
                {modules.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white/[0.02] rounded-3xl border-2 border-dashed border-white/5">
                        <Plus className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-tighter">Nenhum módulo encontrado</h3>
                        <p className="text-sm text-slate-600">Comece criando o primeiro treinamento da LIMS Academy.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
