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

            {/* LEFT SIDE: Form Container */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            {/* RIGHT SIDE: System Description & Vendor Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10">
                <div className="max-w-lg text-center lg:text-left">
                    {/* Hero Title */}
                    <h1 className="text-4xl xl:text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-emerald-200 bg-clip-text text-transparent mb-6 leading-tight">
                        Enterprise LIMS & Quality Management
                    </h1>

                    {/* Tagline */}
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        A next-generation Laboratory Information Management System designed for
                        <span className="text-cyan-400 font-semibold"> food safety</span>,
                        <span className="text-emerald-400 font-semibold"> pharmaceuticals</span>, and
                        <span className="text-amber-400 font-semibold"> industrial quality control</span>.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap gap-3 mb-10 justify-center lg:justify-start">
                        <span className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium">
                            ISO 17025
                        </span>
                        <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
                            21 CFR Part 11
                        </span>
                        <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
                            HACCP
                        </span>
                        <span className="px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-medium">
                            FSSC 22000
                        </span>
                    </div>

                    {/* Vendor Quote */}
                    <div className="border-l-2 border-cyan-500/50 pl-6 mb-8">
                        <p className="text-slate-400 italic text-sm leading-relaxed">
                            "SmartLab transformed our quality operations. Real-time SPC, automated CAPA triggers,
                            and AI-powered insights have reduced our audit preparation time by 70%."
                        </p>
                        <p className="text-slate-500 text-xs mt-3 font-mono">
                            — Quality Director, Major Food Processing Company
                        </p>
                    </div>

                    {/* Logo & Copyright */}
                    <div className="pt-6 border-t border-slate-800/50">
                        <p className="text-xs text-slate-600 font-mono tracking-wider uppercase">
                            Powered by SmartLab Technologies
                        </p>
                        <p className="text-[10px] text-slate-700 mt-1">
                            © 2024 All Rights Reserved
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Footer (Visible only on small screens) */}
            <div className="fixed bottom-4 left-4 right-4 text-center lg:hidden z-10">
                <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                    ISO 17025 · 21 CFR Part 11 · HACCP · FSSC 22000
                </p>
            </div>
        </div>
    );
}
