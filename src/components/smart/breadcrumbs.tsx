"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeMap: Record<string, string> = {
    dashboard: "Painel Principal",
    lab: "Laboratório",
    samples: "Amostras",
    worksheets: "Folhas de Trabalho",
    history: "Histórico",
    "sample-types": "Configuração",
    micro: "Microbiologia",
    incubators: "Incubadoras",
    media: "Meios de Cultura",
    reading: "Leituras",
    production: "Produção",
    lines: "Linhas & Tanques",
    equipment: "Equipamento",
    cip: "CIP & Higiene",
    monitor: "Monitorização",
    programs: "Programas",
    quality: "Qualidade",
    qms: "Gestão da Qualidade (QMS)",
    spc: "Controlo (SPC)",
    specifications: "Especificações",
    products: "Produtos",
    "sampling-points": "Pontos de Recolha",
    inventory: "Inventário",
    stock: "Stock",
    movements: "Movimentações",
    "raw-materials": "Matérias-Primas",
    catalog: "Catálogo",
    lots: "Lotes",
    suppliers: "Fornecedores",
    haccp: "Segurança Alimentar",
    prp: "Prerrequisitos",
    hazards: "Perigos",
    pcc: "Pontos Críticos",
    reports: "Relatórios",
    admin: "Administração",
    users: "Utilizadores",
    settings: "Configurações",
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split("/").filter(Boolean);

    if (paths.length === 0 || (paths.length === 1 && paths[0] === "dashboard")) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-slate-400 mb-4">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-slate-100 transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>

            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join("/")}`;
                const isLast = index === paths.length - 1;
                const label = routeMap[path] || path;

                // Skip "dashboard" if it's the first element as we have the Home icon
                if (path === "dashboard" && index === 0) return null;

                return (
                    <div key={href} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-2 text-slate-700" />
                        {isLast ? (
                            <span className="font-medium text-slate-100 capitalize">
                                {label}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-slate-100 transition-colors capitalize"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
