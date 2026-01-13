"use client";

/**
 * 🛡️ Lucide Icons Client Proxy
 * 
 * Next.js RSC (Server Components) cannot pass component references to Client Components 
 * unless they are Client References. By re-exporting these from a "use client" file, 
 * they become safe to pass as props.
 */

export {
    Activity,
    Clock,
    Zap,
    RefreshCw,
    CheckCircle,
    ShieldAlert,
    Target,
    AlertTriangle,
    TrendingUp,
    Timer,
    ArrowRight,
    FlaskConical,
    Settings2,
    LayoutList,
    Plus,
    Calendar,
    Factory,
    ShieldCheck,
    Scale,
    ClipboardList,
    CheckCircle2,
    FileText,
    Beaker,
    Microscope,
    Globe
} from "lucide-react";
