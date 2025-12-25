import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SmartLab v4 Enterprise",
    description: "Next-generation LIMS & QMS for Industrial Quality Control",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt" className="dark" style={{ colorScheme: 'dark' }}>
            <body className={cn(inter.className, "antialiased")}>
                <NuqsAdapter>
                    {children}
                    <Toaster position="top-right" richColors />
                </NuqsAdapter>
            </body>
        </html>
    );
}


