"use client";

import { useState } from "react";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Plus, Eye } from "lucide-react";
import { createHaccpPlanVersionAction, approveHaccpPlanVersionAction } from "@/app/actions/haccp";
import { toast } from "sonner";
import { SignatureDialog } from "@/components/smart/signature-dialog";
import { VersionSnapshotDialog } from "./version-snapshot-dialog";

interface PlanVersion {
    id: string;
    version_number: string;
    status: "draft" | "approved";
    changes_summary?: string;
    created_at: string;
    approved_at?: string;
    effective_date?: string;
    plan_snapshot: any;
}

interface VersionsListProps {
    versions: PlanVersion[];
}

export function VersionsList({ versions }: VersionsListProps) {
    const [loading, setLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [showSignature, setShowSignature] = useState(false);
    const [showSnapshot, setShowSnapshot] = useState<PlanVersion | null>(null);

    const handleCreateDraft = async () => {
        setLoading(true);
        const nextVersion = `V${versions.length + 1}.0`;
        const formData = new FormData();
        formData.append("version_number", nextVersion);
        formData.append("changes_summary", "Nova revisão do plano HACCP.");

        const result = await createHaccpPlanVersionAction(formData);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const handleApproveClick = (id: string) => {
        setSelectedVersion(id);
        setShowSignature(true);
    };

    const handleConfirmSignature = async (password: string) => {
        if (!selectedVersion) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("version_id", selectedVersion);
        formData.append("password", password);

        try {
            const result = await approveHaccpPlanVersionAction(formData);
            if (result.success) {
                toast.success(result.message);
                setShowSignature(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro inesperado");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: "version_number", label: "Versão" },
        {
            key: "status",
            label: "Estado",
            render: (row: PlanVersion) => (
                <Badge variant={row.status === 'approved' ? 'default' : 'secondary'}>
                    {row.status === 'approved' ? 'Aprovado' : 'Rascunho'}
                </Badge>
            )
        },
        { key: "changes_summary", label: "Alterações" },
        {
            key: "created_at",
            label: "Criado em",
            render: (row: PlanVersion) => new Date(row.created_at).toLocaleDateString()
        },
        {
            key: "effective_date",
            label: "Efetivo desde",
            render: (row: PlanVersion) => row.effective_date ? new Date(row.effective_date).toLocaleDateString() : '-'
        },
        {
            key: "actions",
            label: "Ações",
            render: (row: PlanVersion) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowSnapshot(row)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {row.status === 'draft' && (
                        <Button variant="outline" size="sm" onClick={() => handleApproveClick(row.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovar
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Histórico de Revisões</h3>
                <Button onClick={handleCreateDraft} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Nova Revisão (Draft)
                </Button>
            </div>

            <DataGrid data={versions} columns={columns} />

            <SignatureDialog
                open={showSignature}
                onOpenChange={setShowSignature}
                onConfirm={handleConfirmSignature}
                loading={loading}
                title="Aprovação do Plano HACCP"
                description="Está prestes a aprovar esta versão do plano. Esta ação requer assinatura eletrónica e entrará em vigor imediatamente."
            />

            {showSnapshot && (
                <VersionSnapshotDialog
                    version={showSnapshot}
                    onClose={() => setShowSnapshot(null)}
                />
            )}
        </div>
    );
}
