"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KeyRound, Lock, CheckCircle } from "lucide-react";

import { TechGlassCard } from "@/components/auth/tech-glass-card";
import { GlowInput } from "@/components/auth/glow-input";
import { HologramButton } from "@/components/auth/hologram-button";

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await resetPasswordAction(formData);

        if (result && !result.success) {
            toast.error(result.message);
            setLoading(false);
        }
    };

    return (
        <TechGlassCard>
            {/* Header */}
            <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 mb-4"
                    whileHover={{ rotate: 5 }}
                >
                    <KeyRound className="h-7 w-7 sm:h-8 sm:w-8 text-violet-400" />
                </motion.div>

                <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Reset Password
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Enter your new password below.
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
                    id="password"
                    name="password"
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                />

                <GlowInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<CheckCircle className="h-4 w-4" />}
                />

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                    <motion.div
                        className="flex gap-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                    >
                        {[1, 2, 3, 4].map((level) => (
                            <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-colors ${password.length >= level * 3
                                        ? level <= 2
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                        : "bg-slate-700"
                                    }`}
                            />
                        ))}
                    </motion.div>
                )}

                <HologramButton type="submit" loading={loading}>
                    {loading ? "Updating..." : "Update Password"}
                </HologramButton>
            </motion.form>
        </TechGlassCard>
    );
}
