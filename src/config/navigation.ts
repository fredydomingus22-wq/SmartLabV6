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
    Wrench,
} from "lucide-react";
import { Module } from "@/lib/permissions";
import { ComponentType } from "react";

export interface MenuItem {
    href?: string;
    icon: ComponentType<{ className?: string }>;
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
            { href: "/lab", label: "Amostras Lab" },
            { href: "/micro/samples", label: "Amostras Micro" },
            { href: "/lab/equipment/routine-checks", label: "Verificações Rotina" },
            { href: "/lab/sample-types", label: "Configuração" },
        ]
    },
    {
        label: "Incubação & Micro",
        icon: Microscope,
        module: "micro",
        children: [
            { href: "/micro/incubators", label: "Incubadoras" },
            { href: "/micro/media", label: "Meios de Cultura" },
            { href: "/micro/reading", label: "Leituras" },
            { href: "/micro/configuration/media-types", label: "Configuração Micro" },
        ]
    },
    {
        label: "Produção",
        icon: Factory,
        module: "production",
        children: [
            { href: "/production", label: "Lotes em Curso" },
            { href: "/production/tanks", label: "Monitorização de Tanques" },
            { href: "/production/lines", label: "Linhas de Enchimento" },
        ]
    },
    {
        label: "Gestão de Ativos",
        icon: Wrench,
        module: "assets",
        children: [
            { href: "/assets", label: "Visão Geral" },
            { href: "/assets/instruments", label: "Instrumentos Lab" },
            { href: "/assets/process-equipment", label: "Equipamentos Prod." },
            { href: "/assets/calibrations", label: "Calibrações" },
            { href: "/assets/maintenance", label: "Manutenção Preventiva" },
        ]
    },
    {
        label: "Qualidade (QMS)",
        icon: ShieldCheck,
        module: "qms",
        children: [
            { href: "/quality/qms?tab=dashboard", label: "Performance de Qualidade" },
            { href: "/quality/qms", label: "Não Conformidades & CAPA" },
            { href: "/quality/audits", label: "Auditorias & Vistos" },
            { href: "/quality/objectives", label: "Objetivos Estratégicos" },
            { href: "/quality/parameters", label: "Engenharia de Produto" },
            { href: "/quality/documents", label: "DMS & Manuais" },
            { href: "/quality/training/manager", label: "Training Manager (Admin)" },
            { href: "/quality/training", label: "Formação & Competências" },
            { href: "/quality/spc", label: "CEP (Controlo Estatístico)" },
            { href: "/admin/audit", label: "Rasto de Auditoria (Data Integrity)" },
        ]
    },
    {
        label: "Segurança Alimentar",
        icon: ShieldAlert,
        module: "haccp",
        children: [
            { href: "/haccp/performance", label: "Performance & Compliance" },
            { href: "/haccp/prp", label: "Prerrequisitos (PRP)" },
            { href: "/haccp/pcc", label: "Controlo Crítico (PCC)" },
            { href: "/haccp/hazards", label: "Plano HACCP" },
            { href: "/quality/environmental", label: "Higiene Ambiental" },
            { href: "/haccp/taccp", label: "Food Defense & Fraud" },
        ]
    },
    {
        label: "CIP & Higienização",
        icon: RefreshCw,
        module: "production",
        children: [
            { href: "/cip", label: "Visão Geral" },
            { href: "/cip/register", label: "Execução de Limpeza" },
            { href: "/cip/programs", label: "Programas & Receitas" },
            { href: "/cip/history", label: "Histórico & Auditoria" },
        ]
    },
    {
        label: "Inventário & Materiais",
        icon: Warehouse,
        module: "materials",
        children: [
            { href: "/materials", label: "Geral" },
            { href: "/materials/raw", label: "Matérias-Primas" },
            { href: "/materials/packaging", label: "Embalagem" },
            { href: "/materials/reagents", label: "Reagentes & Consumíveis" },
            { href: "/materials/suppliers", label: "Qualificação de Fornecedores" },
        ]
    },
    {
        href: "/reports",
        icon: FileText,
        label: "Analytics & Relatórios",
        module: "reports"
    },
    {
        label: "Configurações",
        icon: Settings,
        module: "settings",
        children: [
            { href: "/settings/profile", label: "Perfil" },
            { href: "/settings/plant", label: "Configuração da Unidade" },
            { href: "/settings/users", label: "Utilizadores & Permissões" },
            { href: "/saas", label: "Painel SaaS (Admin)" },
        ]
    }
];
