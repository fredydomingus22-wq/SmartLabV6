import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { cn } from "@/lib/utils";

import { QueryProvider } from "@/providers/query-provider";

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
        <html lang="pt" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
            <body className={cn(inter.className, "antialiased")}>
                <NuqsAdapter>
                    <QueryProvider>
                        {children}
                        <Toaster position="top-right" richColors />
                    </QueryProvider>
                </NuqsAdapter>
            </body>
        </html>
    );
}


