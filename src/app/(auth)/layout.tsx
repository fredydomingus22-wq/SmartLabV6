import { CyberBackground } from "@/components/auth/cyber-background";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Futuristic Animated Background */}
            <CyberBackground />

            {/* LEFT SIDE: System Description */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 xl:p-16 relative z-10">
                <div className="max-w-md">
                    {/* System Logo */}
                    <div className="mb-8">
                        <h1 className="text-3xl xl:text-4xl font-bold text-white mb-2">
                            SmartLab
                        </h1>
                        <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
                    </div>

                    {/* Brief System Description */}
                    <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                        Sistema integrado de gestão laboratorial e controlo de qualidade para indústrias alimentares e farmacêuticas.
                    </p>

                    {/* Core Capabilities */}
                    <ul className="space-y-3 mb-10">
                        <li className="flex items-center gap-3 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span className="text-sm">Gestão de Amostras & Análises (LIMS)</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-sm">Controlo de Qualidade & SPC</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-sm">Auditorias & Conformidade ISO</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                            <span className="text-sm">Rastreabilidade & HACCP</span>
                        </li>
                    </ul>

                    {/* Compliance Badges */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="px-3 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                            ISO 17025
                        </span>
                        <span className="px-3 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                            21 CFR Part 11
                        </span>
                        <span className="px-3 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                            FSSC 22000
                        </span>
                    </div>

                    {/* Vendor Branding */}
                    <div className="pt-6 border-t border-slate-800/50">
                        <p className="text-[11px] text-slate-600 font-mono tracking-wider">
                            Powered by <span className="text-cyan-500/80 font-semibold">Zimbotechia</span>
                        </p>
                        <p className="text-[10px] text-slate-700 mt-1">
                            © 2024 Todos os direitos reservados
                        </p>
                    </div>
                </div>
            </div>

            {/* DIVIDER LINE */}
            <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent z-10" />

            {/* RIGHT SIDE: Form Container */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            {/* Mobile Footer */}
            <div className="fixed bottom-4 left-4 right-4 text-center lg:hidden z-10">
                <p className="text-[10px] text-slate-600 font-mono">
                    Powered by <span className="text-cyan-500/80">Zimbotechia</span>
                </p>
            </div>
        </div>
    );
}
