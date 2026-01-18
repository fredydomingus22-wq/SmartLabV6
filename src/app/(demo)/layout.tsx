import "@/app/globals.css";
import { Inter } from "next/font/google";
import { UI5Provider } from "@/components/providers/ui5-provider";

const inter = Inter({ subsets: ["latin"] });

export default function DemoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-[#0a0d10] overflow-hidden`}>
                <UI5Provider>
                    {children}
                </UI5Provider>
            </body>
        </html>
    );
}
