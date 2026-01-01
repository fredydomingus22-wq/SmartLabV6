"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VersionSnapshotDialogProps {
    version: any;
    onClose: () => void;
}

export function VersionSnapshotDialog({ version, onClose }: VersionSnapshotDialogProps) {
    const hazards = version.plan_snapshot?.hazards || [];

    return (
        <Dialog open={!!version} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] glass max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Snapshot da Versão: {version.version_number}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-white/10">
                        <div>
                            <strong>Criado em:</strong> {new Date(version.created_at).toLocaleString()}
                        </div>
                        {version.approved_at && (
                            <div>
                                <strong>Aprovado em:</strong> {new Date(version.approved_at).toLocaleString()}
                            </div>
                        )}
                    </div>

                    <ScrollArea className="h-[500px] rounded-md border border-white/10">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Etapa</TableHead>
                                    <TableHead>Perigo</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>PCC?</TableHead>
                                    <TableHead>Medida de Controlo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hazards.map((hazard: any) => (
                                    <TableRow key={hazard.id}>
                                        <TableCell className="font-medium text-xs">{hazard.process_step}</TableCell>
                                        <TableCell className="text-xs">{hazard.hazard_description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">
                                                {hazard.hazard_category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {hazard.is_pcc ? (
                                                <Badge className="bg-red-600/80 text-[10px]">CCP</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs italic text-muted-foreground">
                                            {hazard.control_measure || "Monitorização Padrão"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {hazards.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Nenhum perigo capturado nesta snapshot.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
