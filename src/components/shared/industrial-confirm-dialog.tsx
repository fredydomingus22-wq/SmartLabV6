"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface IndustrialConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string, password?: string) => Promise<void>
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: "destructive" | "warning" | "success"
    requireReason?: boolean
    requireSignature?: boolean
}

export function IndustrialConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "warning",
    requireReason = true,
    requireSignature = false,
}: IndustrialConfirmDialogProps) {
    const [reason, setReason] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleConfirm = async () => {
        if (requireReason && !reason.trim()) return
        if (requireSignature && !password.trim()) return

        setIsLoading(true)
        try {
            await onConfirm(reason, password)
            onClose()
            setReason("")
            setPassword("")
        } catch (error) {
            console.error("Industrial Confirmation Failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const Icons = {
        destructive: ShieldAlert,
        warning: AlertTriangle,
        success: CheckCircle2,
    }
    const Icon = Icons[variant]

    const variantStyles = {
        destructive: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] glass border-white/10 shadow-2xl overflow-hidden p-0">
                <div className={cn("h-1 w-full",
                    variant === "destructive" ? "bg-rose-500" :
                        variant === "success" ? "bg-emerald-500" : "bg-amber-500"
                )} />

                <div className="p-6 space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={cn("p-2 rounded-xl border", variantStyles[variant])}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-black tracking-tight">{title}</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-400 font-medium pt-1">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    {requireReason && (
                        <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Justificação Obrigatória (Audit Trail)
                            </label>
                            <Textarea
                                placeholder="Descreva o motivo desta ação..."
                                className="bg-black/20 border-white/10 focus:ring-amber-500/50 min-h-[80px] rounded-2xl resize-none text-slate-200"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    )}

                    {requireSignature && (
                        <div className="space-y-4 pt-2 p-4 bg-white/5 border border-white/5 rounded-2xl ring-1 ring-white/10">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-400" />
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    Assinatura Eletrónica (21 CFR Part 11)
                                </label>
                            </div>
                            <Input
                                type="password"
                                placeholder="Insira sua senha de acesso..."
                                className="bg-black/40 border-white/10 h-10 rounded-xl text-white placeholder:text-slate-600 focus:ring-blue-500/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-[9px] text-slate-500 leading-tight">
                                AO CLICAR EM CONFIRMAR, VOCÊ ESTÁ APLICANDO UMA ASSINATURA ELETRÓNICA LEGALMENTE VINCULANTE.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-3 sm:gap-0 pt-4">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="rounded-xl font-bold hover:bg-white/5"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading || (requireReason && !reason.trim()) || (requireSignature && !password.trim())}
                            className={cn(
                                "rounded-xl font-black px-6 shadow-lg transition-all active:scale-95",
                                variant === "destructive" ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20" :
                                    variant === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20" :
                                        "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20"
                            )}
                        >
                            {isLoading ? "A processar..." : confirmLabel}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
