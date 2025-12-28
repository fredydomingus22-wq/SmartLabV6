"use client";

import { useState } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send } from "lucide-react";

import { TechGlassCard } from "@/components/auth/tech-glass-card";
import { GlowInput } from "@/components/auth/glow-input";
import { HologramButton } from "@/components/auth/hologram-button";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await forgotPasswordAction(formData);

        setLoading(false);

        if (result.success) {
            setSent(true);
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    if (sent) {
        return (
            <TechGlassCard>
                <motion.div
                    className="text-center py-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {/* Success Icon */}
                    <motion.div
                        className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4"
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
                    </motion.div>

                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        Check Your Email
                    </h1>
                    <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                        We've sent you a password reset link. Check your inbox and follow the instructions.
                    </p>

                    <Link href="/login">
                        <HologramButton variant="secondary">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </HologramButton>
                    </Link>
                </motion.div>
            </TechGlassCard>
        );
    }

    return (
        <TechGlassCard>
            {/* Header */}
            <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4"
                    whileHover={{ rotate: 5 }}
                >
                    <Send className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
                </motion.div>

                <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Forgot Password
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Enter your email and we'll send you a reset link.
                </p>
            </motion.div>

            {/* Form */}
            <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <GlowInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="you@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <HologramButton type="submit" loading={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                </HologramButton>
            </motion.form>

            {/* Back Link */}
            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </motion.div>
        </TechGlassCard>
    );
}
