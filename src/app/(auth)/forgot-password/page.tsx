"use client";

import { useState } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

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
            <Card className="glass border-white/10">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-green-500/20">
                            <Mail className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
                    <CardDescription>
                        We've sent you a password reset link. Check your inbox and follow the instructions.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Link href="/login">
                        <Button variant="ghost" className="text-white/80">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email and we'll send you a reset link.
                </CardDescription>
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
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/login">
                    <Button variant="ghost" className="text-white/80">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
