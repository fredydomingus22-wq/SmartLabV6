"use client";

import { useState, useEffect } from "react";
import { getUsers } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, UserCog, Shield, Loader2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDialog } from "./user-dialog";
import { SignatureUploadDialog } from "./_components/signature-upload-dialog";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [page, search]); // Reload when page or search changes

    async function loadUsers() {
        setLoading(true);
        const res = await getUsers(page, 10, search);
        if (res.error) {
            toast.error(res.error);
        } else {
            setUsers(res.data || []);
        }
        setLoading(false);
    }

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on search
        loadUsers();
    };

    return (
        <div className="space-y-8 pb-10">
            <PageHeader
                variant="indigo"
                icon={<Users className="h-4 w-4" />}
                overline="System Configuration • Identity"
                title="Gestão de Utilizadores"
                description="Administração de acessos, perfis e roles de utilizadores do SmartLab."
            />

            <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 pb-8">
                    <CardTitle className="text-xl font-black uppercase tracking-wider text-white">Utilizadores Registados</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                        Utilizadores ativos com acesso ao sistema.
                    </CardDescription>
                    <div className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    placeholder="Procurar por nome..."
                                    className="pl-10 bg-slate-950 border-slate-800"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="secondary" className="bg-slate-900 hover:bg-slate-800 border border-slate-700">Procurar</Button>
                        </form>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-900/40">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Utilizador</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Role</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Organização</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Fábrica</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4 text-center">Assinatura</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4 text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-800/50">
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16 text-slate-500 italic">
                                                Nenhum utilizador encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id} className="border-slate-800/50 hover:bg-slate-900/20 transition-colors group">
                                                <TableCell className="px-6 py-4">
                                                    <div className="font-bold text-slate-200">{user.full_name}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 uppercase">{user.employee_id || "No ID"}</div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <Badge variant="outline" className="capitalize text-[10px] font-bold border-slate-700 bg-slate-900/50">
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-sm text-slate-400">{user.organizations?.name}</TableCell>
                                                <TableCell className="px-6 py-4 text-sm text-slate-400">{user.plants?.name || "Todas"}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <SignatureUploadDialog
                                                        userId={user.id}
                                                        userName={user.full_name || "Utilizador"}
                                                        currentSignatureUrl={user.signature_url}
                                                    />
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-indigo-500/10 hover:text-indigo-400">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEdit(user)} className="text-xs focus:bg-indigo-500/10 focus:text-indigo-400 cursor-pointer">
                                                                <UserCog className="mr-2 h-4 w-4" />
                                                                Editar Perfil
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <UserDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        loadUsers(); // Refresh list on close
                        setSelectedUser(null);
                    }
                }}
                user={selectedUser}
            />
        </div>
    );
}
