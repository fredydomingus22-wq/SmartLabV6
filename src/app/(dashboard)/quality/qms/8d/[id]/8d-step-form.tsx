"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronRight } from "lucide-react";
import { update8DStepAction } from "@/app/actions/qms";
import { toast } from "sonner";
import { SignatureDialog } from "@/components/smart/signature-dialog";

import { SearchableSelect } from "@/components/smart/searchable-select";

interface EightDStepFormProps {
    reportId: string;
    step: number;
    currentData: any;
    users: { id: string, full_name: string | null, role: string }[];
}

export function EightDStepForm({ reportId, step, currentData, users }: EightDStepFormProps) {
    const [isPending, startTransition] = useTransition();
    const [showSignature, setShowSignature] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (step === 8) {
            setShowSignature(true);
        } else {
            submitForm();
        }
    };

    const submitForm = (password?: string) => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        formData.set("id", reportId);
        formData.set("step", String(step + 1)); // Actually, if step is 8, it stays 8 but backend handles completion

        if (password) {
            formData.append("password", password);
        }

        startTransition(async () => {
            const result = await update8DStepAction(formData);
            if (result.success) {
                toast.success(result.message);
                setShowSignature(false);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleConfirmSignature = async (password: string) => {
        submitForm(password);
    };

    return (
        <>
            <form ref={formRef} onSubmit={handleSubmit} className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                {step === 1 && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="champion">Líder (Champion) *</Label>
                            <SearchableSelect
                                name="champion"
                                options={users.map(u => ({
                                    value: u.id,
                                    label: `${u.full_name || 'Sem Nome'} (${u.role})`
                                }))}
                                defaultValue={currentData.champion || ""}
                                placeholder="Selecionar líder da equipa..."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="team_members">Membros da Equipa</Label>
                            <p className="text-[10px] text-slate-500 italic mb-1">
                                Nota: Por agora, selecione o líder e documente os membros abaixo.
                                Tarefas serão criadas para o Líder. (Multisseleção em desenvolvimento)
                            </p>
                            <Textarea
                                id="team_members_text"
                                name="team_members_text"
                                placeholder="João, Maria, Pedro..."
                                defaultValue={currentData.team_members?.join(", ") || ""}
                                className="glass"
                                rows={2}
                            />
                            {/* Hidden field to maintain compatibility with existing array structure if needed */}
                            <input type="hidden" name="team_members" value={currentData.team_members?.join(",") || ""} />
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="grid gap-2">
                        <Label htmlFor="problem_description">Descrição do Problema (5W2H)</Label>
                        <Textarea
                            id="problem_description"
                            name="problem_description"
                            placeholder="O Quê, Onde, Quando, Quem, Porquê, Como, Quanto..."
                            rows={4}
                            defaultValue={currentData.problem_description || ""}
                            className="glass"
                        />
                    </div>
                )}

                {step === 3 && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="containment_actions">Ações de Contenção</Label>
                            <Textarea
                                id="containment_actions"
                                name="containment_actions"
                                placeholder="Ações imediatas para conter o problema..."
                                rows={3}
                                defaultValue={currentData.containment_actions || ""}
                                className="glass"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="containment_verified"
                                name="containment_verified"
                                value="true"
                                defaultChecked={currentData.containment_verified}
                                className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="containment_verified">Contenção verificada</Label>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="root_cause_method">Método Utilizado</Label>
                            <select
                                id="root_cause_method"
                                name="root_cause_method"
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary glass"
                                defaultValue={currentData.root_cause_method || ""}
                            >
                                <option value="">Selecione o método...</option>
                                <option value="5why">5 Porquês (5 Why)</option>
                                <option value="fishbone">Espinha de Peixe (Ishikawa)</option>
                                <option value="pareto">Análise de Pareto</option>
                                <option value="fmea">FMEA</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="root_cause_analysis">Análise de Causa Raiz</Label>
                            <Textarea
                                id="root_cause_analysis"
                                name="root_cause_analysis"
                                placeholder="Descreva a análise de causa raiz..."
                                rows={4}
                                defaultValue={currentData.root_cause_analysis || ""}
                                className="glass"
                            />
                        </div>
                    </>
                )}

                {step === 5 && (
                    <div className="grid gap-2">
                        <Label htmlFor="corrective_actions">Ações Corretivas Permanentes</Label>
                        <Textarea
                            id="corrective_actions"
                            name="corrective_actions"
                            placeholder="Descreva as ações corretivas permanentes..."
                            rows={4}
                            defaultValue={currentData.corrective_actions || ""}
                            className="glass"
                        />
                    </div>
                )}

                {step === 6 && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="implementation_plan">Plano de Implementação</Label>
                            <Textarea
                                id="implementation_plan"
                                name="implementation_plan"
                                placeholder="Descreva o plano de implementação..."
                                rows={3}
                                defaultValue={currentData.implementation_plan || ""}
                                className="glass"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="implementation_date">Data de Implementação</Label>
                            <Input
                                id="implementation_date"
                                name="implementation_date"
                                type="date"
                                defaultValue={currentData.implementation_date || ""}
                                className="glass text-white [color-scheme:dark]"
                            />
                        </div>
                    </>
                )}

                {step === 7 && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="preventive_actions">Ações Preventivas</Label>
                            <Textarea
                                id="preventive_actions"
                                name="preventive_actions"
                                placeholder="Ações para prevenir recorrência..."
                                rows={3}
                                defaultValue={currentData.preventive_actions || ""}
                                className="glass"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="systemic_changes">Alterações Sistémicas</Label>
                            <Textarea
                                id="systemic_changes"
                                name="systemic_changes"
                                placeholder="Alterações em sistemas, procedimentos, formação..."
                                rows={3}
                                defaultValue={currentData.systemic_changes || ""}
                                className="glass"
                            />
                        </div>
                    </>
                )}

                {step === 8 && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="lessons_learned">Lições Aprendidas</Label>
                            <Textarea
                                id="lessons_learned"
                                name="lessons_learned"
                                placeholder="Principais conclusões desta investigação..."
                                rows={3}
                                defaultValue={currentData.lessons_learned || ""}
                                className="glass"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recognition_notes">Reconhecimento da Equipa</Label>
                            <Textarea
                                id="recognition_notes"
                                name="recognition_notes"
                                placeholder="Agradecimento pelos esforços da equipa..."
                                rows={2}
                                defaultValue={currentData.recognition_notes || ""}
                                className="glass"
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isPending} className="glass-primary">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {step === 8 ? "Concluir 8D" : (
                            <>
                                Guardar & Continuar
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <SignatureDialog
                open={showSignature}
                onOpenChange={setShowSignature}
                onConfirm={handleConfirmSignature}
                loading={isPending}
                title="Finalizar Relatório 8D"
                description="A sua assinatura eletrónica confirma a conclusão de todos os passos D1-D8 e o encerramento do relatório."
            />
        </>
    );
}
