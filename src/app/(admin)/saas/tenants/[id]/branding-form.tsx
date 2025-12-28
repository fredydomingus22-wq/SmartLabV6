"use client";

import { useState } from "react";
import { updateTenantBrandingAction } from "@/app/actions/admin/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Palette, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BrandingFormProps {
    organization: any;
}

export function BrandingForm({ organization }: BrandingFormProps) {
    const [loading, setLoading] = useState(false);
    const settings = organization.settings || {};

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('id', organization.id);

        try {
            const res = await updateTenantBrandingAction(formData);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 mb-6 bg-slate-900/20 px-6 py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5 text-pink-400" />
                        Identidade Visual
                    </CardTitle>
                    <CardDescription>
                        Personalize o ambiente desta organização para refletir a sua marca.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Org Name */}
                        <div className="space-y-3 md:col-span-2">
                            <Label className="text-slate-400">Nome da Organização</Label>
                            <Input
                                name="name"
                                defaultValue={organization.name}
                                className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50"
                            />
                        </div>

                        {/* Logo URL */}
                        <div className="space-y-3">
                            <Label className="text-slate-400 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Logo URL
                            </Label>
                            <Input
                                name="logo_url"
                                defaultValue={organization.logo_url || ""}
                                placeholder="https://exemplo.com/logo.png"
                                className="bg-slate-900/50 border-slate-800 focus:border-pink-500/50"
                            />
                            <p className="text-[10px] text-slate-500 uppercase font-medium tracking-tight">
                                URL de imagem pública ou CDN. Recomendado: SVG ou PNG Transparente.
                            </p>
                        </div>

                        {/* Primary Color */}
                        <div className="space-y-3">
                            <Label className="text-slate-400 flex items-center gap-2">
                                <Palette className="h-4 w-4" /> Cor Primária (Hex)
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    name="primary_color"
                                    defaultValue={settings.primaryColor || "#4F46E5"}
                                    type="color"
                                    className="w-12 h-10 p-1 bg-slate-900 border-slate-800 rounded-lg cursor-pointer"
                                />
                                <Input
                                    name="primary_color_text"
                                    defaultValue={settings.primaryColor || "#4F46E5"}
                                    placeholder="#000000"
                                    className="flex-1 bg-slate-900/50 border-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            disabled={loading}
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 shadow-lg shadow-blue-900/20"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Guardar Alterações
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="bg-slate-950/20 border-slate-800 border-dashed">
                <CardContent className="p-6">
                    <h5 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4 font-bold">Preview do Ambiente</h5>
                    <div className="h-32 rounded-xl flex items-center justify-center border border-white/5 bg-slate-900/50 shadow-inner">
                        {organization.logo_url ? (
                            <img src={organization.logo_url} alt="Logo" className="h-12 object-contain" />
                        ) : (
                            <div className="text-slate-700 font-mono text-xs italic">Nenhum logo configurado</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
