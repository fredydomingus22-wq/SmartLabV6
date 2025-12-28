"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Thermometer, FlaskConical, Scale } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { logLabAssetActivityAction } from "@/app/actions/lab-assets";
import { toast } from "sonner";

interface LabAsset {
    id: string;
    name: string;
    code: string;
    asset_category: string;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'balance': return <Scale className="h-4 w-4 text-blue-400" />;
        case 'ph_meter': return <FlaskConical className="h-4 w-4 text-emerald-400" />;
        case 'thermometer': return <Thermometer className="h-4 w-4 text-orange-400" />;
        default: return <FlaskConical className="h-4 w-4 text-slate-400" />;
    }
};

export function RoutineCheckForm({ equipments }: { equipments: LabAsset[] }) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const handleSuccess = (equipmentId: string) => {
        setCheckedItems(prev => ({ ...prev, [equipmentId]: true }));
        toast.success("Verificação registada com sucesso!");
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {equipments.map((eq) => (
                <Card key={eq.id} className={`glass overflow-hidden border-slate-800/50 transition-all ${checkedItems[eq.id] ? 'opacity-60 grayscale' : 'hover:border-emerald-500/30'}`}>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                {getCategoryIcon(eq.asset_category)}
                                {eq.name}
                            </CardTitle>
                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider mt-1">{eq.code}</CardDescription>
                        </div>
                        {checkedItems[eq.id] && <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in zoom-in duration-300" />}
                    </CardHeader>
                    <CardContent>
                        {checkedItems[eq.id] ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                                <p className="text-xs text-emerald-400 font-medium">Verificado hoje</p>
                            </div>
                        ) : (
                            <ActionForm
                                action={logLabAssetActivityAction}
                                onSuccess={() => handleSuccess(eq.id)}
                                showFooter={false}
                                className="space-y-3"
                            >
                                <input type="hidden" name="asset_id" value={eq.id} />
                                <input type="hidden" name="maintenance_type" value="verification" />
                                <input type="hidden" name="result" value="pass" />
                                <input type="hidden" name="description" value={`Verificação de rotina diária (${new Date().toLocaleDateString()})`} />
                                <input type="hidden" name="performed_at" value={new Date().toISOString()} />

                                <div className="flex gap-2">
                                    <Button type="submit" className="w-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border-emerald-500/30">
                                        Confirmar Pass
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white"
                                        onClick={() => window.location.href = `/production/equipment/${eq.id}`}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </ActionForm>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
