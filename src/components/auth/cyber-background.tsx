"use client";

import { motion } from "framer-motion";

/**
 * CyberBackground - Futuristic Industrial Background
 * Creates an immersive "command center" atmosphere with:
 * - Deep obsidian gradient base
 * - Animated scanning grid lines
 * - Floating energy orbs
 * - Subtle particle effects
 */
export function CyberBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Obsidian Base with Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950" />

            {/* Animated Scanning Grid */}
            <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Horizontal Scanning Line */}
            <motion.div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Vertical Scanning Line */}
            <motion.div
                className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent"
                initial={{ left: "-10%" }}
                animate={{ left: "110%" }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
            />

            {/* Floating Energy Orbs */}
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl"
                initial={{ x: "10%", y: "20%" }}
                animate={{
                    x: ["10%", "70%", "30%", "10%"],
                    y: ["20%", "60%", "80%", "20%"]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-violet-500/10 blur-3xl"
                initial={{ x: "80%", y: "70%" }}
                animate={{
                    x: ["80%", "20%", "60%", "80%"],
                    y: ["70%", "30%", "10%", "70%"]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl md:block hidden"
                initial={{ x: "50%", y: "50%" }}
                animate={{
                    x: ["50%", "10%", "90%", "50%"],
                    y: ["50%", "80%", "20%", "50%"]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/20" />
            <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/20" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20" />

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
        </div>
    );
}
