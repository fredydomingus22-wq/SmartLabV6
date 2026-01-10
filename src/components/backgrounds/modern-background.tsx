export function ModernBackground() {
    return (
        <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

            {/* Glowing Orbs - Simplified for performance but elegant */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />

            {/* Subtle Grid - very faint */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

            {/* Radial Vignette */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-slate-950/80" />
        </div>
    );
}
