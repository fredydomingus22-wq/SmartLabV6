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
            <DialogContent className="sm:max-w-[425px] overflow-hidden p-0">
                <div className={cn("h-1.5 w-full",
                    variant === "destructive" ? "bg-destructive" :
                        variant === "success" ? "bg-emerald-500" : "bg-amber-500"
                )} />

                <div className="p-6 space-y-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={cn("p-2 rounded-xl border", variantStyles[variant])}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-muted-foreground pt-1">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    {requireReason && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Justificação Obrigatória (Audit Trail)
                            </label>
                            <Textarea
                                placeholder="Descreva o motivo desta ação..."
                                className="min-h-[100px] bg-muted/20 resize-none text-sm"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    )}

                    {requireSignature && (
                        <div className="space-y-4 p-4 bg-muted/40 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                                    Assinatura Eletrónica (21 CFR Part 11)
                                </label>
                            </div>
                            <Input
                                type="password"
                                placeholder="Sua senha de acesso..."
                                className="h-10 bg-background"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-[9px] text-muted-foreground leading-tight italic">
                                Ao clicar em confirmar, você declara estar aplicando uma assinatura eletrónica tecnicamente vinculante.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading || (requireReason && !reason.trim()) || (requireSignature && !password.trim())}
                            className={cn(
                                "flex-1 font-bold shadow-sm transition-all active:scale-95",
                                variant === "destructive" ? "bg-destructive hover:bg-destructive/90" :
                                    variant === "success" ? "bg-emerald-600 hover:bg-emerald-700" :
                                        "bg-amber-500 hover:bg-amber-600"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processando
                                </>
                            ) : confirmLabel}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
