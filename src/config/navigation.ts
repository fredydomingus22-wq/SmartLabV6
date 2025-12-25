
import {
    LayoutDashboard,
    FlaskConical,
    Factory,
    Microscope,
    Settings,
    Warehouse,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    Globe,
    FileText,
} from "lucide-react";

export const menuItems = [
    {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: "Painel Principal",
        allowedRoles: ["admin", "system_owner", "analyst", "micro_analyst", "lab_analyst"]
    },
    {
        label: "Laboratório (LIMS)",
        icon: FlaskConical,
        allowedRoles: ["admin", "analyst", "lab_analyst"],
        children: [
            { href: "/lab", label: "Amostras" },
            { href: "/lab/history", label: "Histórico" },
            { href: "/lab/sample-types", label: "Configuração" },
        ]
    },
    {
        label: "Microbiologia",
        icon: Microscope,
        allowedRoles: ["admin", "analyst", "micro_analyst"],
        children: [
            { href: "/micro/samples", label: "Amostras" },
            { href: "/micro/incubators", label: "Incubadoras" },
            { href: "/micro/media", label: "Meios de Cultura" },
            { href: "/micro/reading", label: "Leituras" },
            { href: "/micro/configuration/media-types", label: "Configuração" },
        ]
    },
    {
        label: "Produção",
        icon: Factory,
        allowedRoles: ["admin", "operator"],
        children: [
            { href: "/production", label: "Lotes Ativos" },
            { href: "/production/lines", label: "Linhas & Tanques" },
            { href: "/production/equipment", label: "Equipamento" },
        ]
    },
    {
        label: "CIP & Higiene",
        icon: RefreshCw,
        allowedRoles: ["admin", "operator", "quality"],
        children: [
            { href: "/cip/register", label: "Registar CIP" },
            { href: "/cip/history", label: "Histórico" },
            { href: "/cip/programs", label: "Programas" },
        ]
    },
    {
        label: "Qualidade (QMS)",
        icon: ShieldCheck,
        allowedRoles: ["admin", "quality"],
        children: [
            { href: "/quality/qms", label: "Desvios (NC)" },
            { href: "/quality/qms/capa", label: "CAPA" },
            { href: "/quality/qms/8d", label: "Relatórios 8D" },
            { href: "/quality/audits", label: "Auditorias Internas" },
            { href: "/quality/objectives", label: "Objetivos da Qualidade" },
            { href: "/quality/manuals", label: "Gestão Documental (DMS)" },
            { href: "/quality/training", label: "Formação & Competências" },
            { href: "/quality/spc", label: "Controlo (SPC)" },
            { href: "/reports/coa", label: "Certificados (COA)" },
            { href: "/quality/parameters", label: "Parâmetros" },
            { href: "/quality/specifications", label: "Especificações" },
            { href: "/quality/products", label: "Produtos" },
            { href: "/quality/sampling-points", label: "Pontos de Recolha" },
        ]
    },

    {
        label: "Segurança Alimentar",
        icon: ShieldAlert,
        allowedRoles: ["admin", "haccp"],
        children: [
            { href: "/haccp/prp", label: "Prerrequisitos (PRP)" },
            { href: "/haccp/hazards", label: "Perigos" },
            { href: "/haccp/pcc", label: "Pontos Críticos (PCC)" },
            { href: "/haccp/taccp", label: "Food Defense (TACCP)" },
            { href: "/haccp/vaccp", label: "Food Fraud (VACCP)" },
            { href: "/quality/environmental", label: "Monitorização Ambiental" },
        ]
    },
    {
        label: "Gestão de Materiais",
        icon: Warehouse,
        allowedRoles: ["admin", "warehouse"],
        children: [
            { href: "/raw-materials/catalog", label: "Matérias-Primas" },
            { href: "/raw-materials/lots", label: "Lotes M.P." },
            { href: "/materials/packaging", label: "Mat. de Embalagem" },
            { href: "/materials/packaging/lots", label: "Lotes Embalagem" },
            { href: "/inventory/stock", label: "Reagentes (Lab)" },
            { href: "/raw-materials/suppliers", label: "Fornecedores" },
        ]
    },
    {
        href: "/reports",
        icon: FileText,
        label: "Relatórios & Analytics",
        allowedRoles: ["admin", "quality"]
    },
    {
        label: "Administração",
        icon: Settings,
        allowedRoles: ["admin", "system_owner"],
        children: [
            { href: "/settings", label: "Configurações" },
            { href: "/admin/users", label: "Utilizadores" },
        ]
    },
    {
        label: "Sistema (SaaS)",
        icon: Globe,
        href: "/saas",
        role: "system_owner",
        allowedRoles: ["system_owner"]
    }
];
