import { CyberBackground } from "@/components/auth/cyber-background";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Futuristic Animated Background */}
            <CyberBackground />

            {/* Content Container - Responsive Padding */}
            <div className="w-full max-w-md p-4 sm:p-6 md:p-8 relative z-10">
                {children}
            </div>

            {/* Footer Certification Badge */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center">
                <p className="text-[10px] sm:text-xs text-slate-500 font-mono tracking-wider uppercase">
                    ISO 17025 · 21 CFR Part 11 · HACCP Compliant
                </p>
            </div>
        </div>
    );
}
