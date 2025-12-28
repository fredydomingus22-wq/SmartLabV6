
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
    ClipboardList,
} from "lucide-react";
import { Module } from "@/lib/permissions";

export interface MenuItem {
    href?: string;
    icon: any;
    label: string;
    module: Module;
    children?: { href: string; label: string }[];
}

export const menuItems: MenuItem[] = [
    {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: "Painel Principal",
        module: "dashboard"
    },
    {
        href: "/tasks",
        icon: ClipboardList,
        label: "Gestão de Tarefas",
        module: "tasks"
    },
    {
        label: "Laboratório (LIMS)",
        icon: FlaskConical,
        module: "lab",
        children: [
            { href: "/lab", label: "Amostras" },
            { href: "/lab/equipment/routine-checks", label: "Verificações" },
            { href: "/lab/history", label: "Histórico" },
            { href: "/lab/sample-types", label: "Configuração" },
        ]
    },
    {
        label: "Microbiologia",
        icon: Microscope,
        module: "micro",
        children: [
            { href: "/micro/samples", label: "Amostras" },
            { href: "/micro/incubators", label: "Incubadoras" },
            { href: "/micro/media", label: "Meios de Cultura" },
            { href: "/micro/reading", label: "Leituras" },
            { href: "/micro/configuration/media-types", label: "Configuração" },
        ]
    },
    {
        label: "Ativos & Equipamento",
        icon: Factory,
        module: "production",
        children: [
            { href: "/production/tanks", label: "Tanques" },
            { href: "/production/equipment", label: "Equipamentos de Processo" },
            { href: "/lab/assets", label: "Instrumentos de Lab" },
            { href: "/production/lines", label: "Linhas de Produção" },
        ]
    },
    {
        label: "Produção",
        icon: Factory,
        module: "production",
        children: [
            { href: "/production", label: "Lotes Ativos" },
        ]
    },
    {
        label: "CIP & Higiene",
        icon: RefreshCw,
        module: "cip",
        children: [
            { href: "/cip/register", label: "Registar CIP" },
            { href: "/cip/history", label: "Histórico" },
            { href: "/cip/programs", label: "Programas" },
        ]
    },
    {
        label: "Qualidade (QMS)",
        icon: ShieldCheck,
        module: "qms",
        children: [
            { href: "/quality/qms?tab=dashboard", label: "Dashboard de Qualidade" },
            { href: "/quality/qms", label: "Ocorrências & CAPA" },
            { href: "/quality/audits", label: "Auditorias Internas" },
            { href: "/quality/objectives", label: "Objetivos & KPIs" },
            { href: "/quality/parameters", label: "Engenharia de Qualidade" },
            { href: "/quality/manuals", label: "Conformidade & DMS" },
            { href: "/quality/spc", label: "Controlo & Performance" },
        ]
    },
    {
        label: "Segurança Alimentar",
        icon: ShieldAlert,
        module: "haccp",
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
        module: "materials",
        children: [
            { href: "/materials", label: "Dashboard" },
            { href: "/materials/raw", label: "Matérias-Primas" },
            { href: "/materials/packaging", label: "Embalagem" },
            { href: "/materials/reagents", label: "Reagentes" },
            { href: "/materials/suppliers", label: "Fornecedores" },
        ]
    },
    {
        href: "/reports",
        icon: FileText,
        label: "Relatórios & Analytics",
        module: "reports"
    },
    {
        label: "Administração",
        icon: Settings,
        module: "settings",
        children: [
            { href: "/settings", label: "Configurações" },
            { href: "/admin/users", label: "Utilizadores" },
        ]
    },
    {
        label: "Sistema (SaaS)",
        icon: Globe,
        href: "/saas",
        module: "saas"
    }
];
