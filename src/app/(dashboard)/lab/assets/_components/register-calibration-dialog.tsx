"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, RotateCw, FileCheck } from "lucide-react";
import { registerLabCalibrationAction } from "@/app/actions/lab_modules/assets";
import { z } from "zod";

const CalibrationSchema = z.object({
    asset_id: z.string().uuid("Selecione um instrumento"),
    performed_at: z.string().min(1, "Data é obrigatória"),
    certificate_number: z.string().min(1, "Número do certificado é obrigatório"),
    issued_by: z.string().min(1, "Laboratório/Entidade é obrigatório"),
    result: z.enum(["pass", "fail", "conditional"]),
    next_calibration_date: z.string().min(1, "Próxima data é obrigatória"),
    notes: z.string().optional(),
});

type CalibrationFormValues = z.infer<typeof CalibrationSchema>;

interface RegisterCalibrationDialogProps {
    asset?: { id: string; name: string; code: string; next_calibration_date?: string | null };
    assets?: { id: string; name: string; code: string }[];
    children?: React.ReactNode;
}

export function RegisterCalibrationDialog({ asset, assets, children }: RegisterCalibrationDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<CalibrationFormValues>({
        resolver: zodResolver(CalibrationSchema),
        defaultValues: {
            asset_id: asset?.id || "",
            performed_at: new Date().toISOString().split('T')[0],
            certificate_number: "",
            issued_by: "",
            result: "pass",
            next_calibration_date: "",
            notes: "",
        },
    });

    const onSubmit = (data: CalibrationFormValues) => {
        startTransition(async () => {
            const result = await registerLabCalibrationAction(data);
            if (result.success) {
                toast.success("Calibração registada com sucesso!");
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.message || "Erro ao registar calibração.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                        <Calendar className="h-4 w-4 mr-2" />
                        Registar Calibração
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass border-white/10">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <FileCheck className="h-5 w-5 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white">Registar Calibração</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Introduza os detalhes do novo certificado de calibração para o instrumento.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {!asset && assets && (
                            <FormField
                                control={form.control}
                                name="asset_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Instrumento</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                    <SelectValue placeholder="Selecione o instrumento" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {assets.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.name} ({a.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {asset && (
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5 mb-4">
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Instrumento Selecionado</p>
                                <p className="text-sm font-bold text-emerald-400">{asset.name} ({asset.code})</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="performed_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Data da Calibração</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="result"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Resultado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pass">Conforme (Pass)</SelectItem>
                                                <SelectItem value="fail">Não Conforme (Fail)</SelectItem>
                                                <SelectItem value="conditional">Condicional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="certificate_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Nº do Certificado</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: CERT-2024-001" {...field} className="bg-white/5 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="issued_by"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Laboratório / Entidade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: IPQ ou Laboratório Externo" {...field} className="bg-white/5 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="next_calibration_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Próxima Calibração (Validade)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Notas Adicionais</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="bg-white/5 border-white/10 text-white min-h-[80px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold min-w-[140px]">
                                {isPending ? <RotateCw className="h-4 w-4 animate-spin" /> : "Registar Calibração"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
