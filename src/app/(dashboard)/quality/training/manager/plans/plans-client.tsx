"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTrainingPlan } from "@/app/actions/quality/training-authoring";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Layers, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { ManagerTabs } from "../manager-tabs";
import { PageHeader } from "@/components/layout/page-header";

// Mock Job Titles (Ideally fetched from backend/role-matrix)
const JOB_TITLES = [
    "Lab Analyst", "Microbiologist", "Quality Manager", "Production Operator", "Warehouse Manager"
];

const formSchema = z.object({
    title: z.string().min(3, "Title too short"),
    description: z.string().optional(),
    job_titles: z.array(z.string()).min(1, "Select at least one job title"),
    recurrence_interval: z.string().optional()
});

interface TrainingPlan {
    id: string;
    title: string;
    description: string | null;
    job_titles: string[];
    recurrence_interval: string | null;
    created_at: string;
}

interface ModuleBasic {
    id: string;
    title: string;
}

export function PlansClient({ plans, modules }: { plans: TrainingPlan[], modules: ModuleBasic[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            job_titles: [],
            recurrence_interval: "1 year"
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const result = await createTrainingPlan(values);

        startTransition(() => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Curriculum Plan created");
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
                overline="Curriculum Matrix"
                title="Matriz de Currículos"
                description="Defina planos de treinamento recorrentes por cargo."
                backHref="/quality"
                actions={
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[10px] tracking-widest px-6 h-11 shadow-[0_0_20px_rgba(147,51,234,0.2)] border-0">
                                <Plus className="w-4 h-4" /> Novo Plano
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-black/90 border-white/10 backdrop-blur-2xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black tracking-tight">Criar Currículo Academy</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Título do Plano</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Integração Anual de Qualidade" {...field} className="bg-white/5 border-white/10 focus:border-purple-500/50 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Cargos Abrangidos</FormLabel>
                                        <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                                            {JOB_TITLES.map(role => (
                                                <label key={role} className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1 rounded-md transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        value={role}
                                                        checked={form.watch("job_titles").includes(role)}
                                                        onChange={(e) => {
                                                            const current = form.getValues("job_titles");
                                                            if (e.target.checked) form.setValue("job_titles", [...current, role]);
                                                            else form.setValue("job_titles", current.filter(r => r !== role));
                                                        }}
                                                        className="rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-tight font-bold">{role}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>

                                    <FormField
                                        control={form.control}
                                        name="recurrence_interval"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Recorrência (Intervalo)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: 1 year, 6 months" {...field} className="bg-white/5 border-white/10 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={isPending} className="w-full bg-purple-600 hover:bg-purple-500 h-12 font-black uppercase text-xs tracking-widest mt-4 border-0">
                                        {isPending ? "Configurando..." : "Salvar Plano Curricular"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <ManagerTabs />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <GlassCard key={plan.id} className="p-6 transition-all hover:bg-white/[0.04] border-white/5 hover:border-purple-500/30 relative overflow-hidden flex flex-col justify-between h-full">
                        <div className="mb-4">
                            <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors mb-4 leading-tight">
                                {plan.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {plan.job_titles.map((role: string) => (
                                    <span key={role} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-widest pt-4 border-t border-white/5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Recorrência: {plan.recurrence_interval || "Única"}</span>
                        </div>
                    </GlassCard>
                ))}
                {plans.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white/[0.02] rounded-3xl border-2 border-dashed border-white/5">
                        <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-tighter">Nenhum plano curricular</h3>
                        <p className="text-sm text-slate-600">Defina currículos para automatizar a atribuição de treinamentos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
