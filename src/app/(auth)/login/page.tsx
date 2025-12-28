"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";

import { TechGlassCard } from "@/components/auth/tech-glass-card";
import { GlowInput } from "@/components/auth/glow-input";
import { HologramButton } from "@/components/auth/hologram-button";

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";
    const message = searchParams.get("message");

    if (message) {
        toast.success(message);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("next", next);

        const result = await loginAction(formData);

        if (result && !result.success) {
            toast.error(result.message);
            setLoading(false);
        }
    };

    return (
        <TechGlassCard>
            {/* Logo & Branding */}
            <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 mb-4"
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <LogIn className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400" />
                </motion.div>

                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Acessar Plataforma
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-mono tracking-wider">
                    Secure Access Portal
                </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <GlowInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div className="space-y-1">
                    <GlowInput
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="text-right">
                        <Link
                            href="/forgot-password"
                            className="text-xs text-cyan-400/80 hover:text-cyan-400 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <HologramButton type="submit" loading={loading}>
                    {loading ? "Authenticating..." : "Access System"}
                </HologramButton>
            </motion.form>

            {/* Mobile-only system info */}
            <motion.div
                className="mt-6 pt-4 border-t border-slate-800/50 text-center lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-xs text-slate-500">
                    Enterprise LIMS & Quality Management
                </p>
            </motion.div>
        </TechGlassCard>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <TechGlassCard>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-sm text-slate-400">Loading...</p>
                </div>
            </TechGlassCard>
        }>
            <LoginForm />
        </Suspense>
    );
}
