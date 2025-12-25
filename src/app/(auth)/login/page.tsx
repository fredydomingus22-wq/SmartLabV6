"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, FlaskConical } from "lucide-react";

import { Suspense } from "react";

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";
    const message = searchParams.get("message");

    // Show message from URL (e.g., password reset success)
    if (message) {
        toast.success(message);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("next", next); // Pass the redirect destination

        const result = await loginAction(formData);

        // Only reaches here if redirect failed
        if (result && !result.success) {
            toast.error(result.message);
            setLoading(false);
        }
    };

    return (
        <Card className="glass border-white/10">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/20">
                        <FlaskConical className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl text-white">SmartLab v4</CardTitle>
                <CardDescription>Enterprise LIMS & Quality Management</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/80">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                            autoComplete="email"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-white/80">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-white/60">
                    ISO 17025 · 21 CFR Part 11 · HACCP
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8 bg-black/20 rounded-lg animate-pulse">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

