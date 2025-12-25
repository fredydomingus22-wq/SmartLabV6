"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Bell,
    Settings,
    LogOut,
    User,
    LayoutGrid,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/smart/logout-button";
import { Badge } from "@/components/ui/badge";
import { SafeUser } from "@/lib/auth";
import Link from "next/link";

interface AppHeaderProps {
    user: SafeUser;
}

export function AppHeader({ user }: AppHeaderProps) {
    const [greeting, setGreeting] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const updateGreeting = () => {
            const now = new Date();
            // Using Africa/Luanda (UTC+1) assumption for greeting logic
            // In a real app, this would use user profile timezone
            const hour = now.getHours();

            if (hour >= 5 && hour < 12) setGreeting("Bom dia");
            else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
            else setGreeting("Boa noite");

            setCurrentTime(now);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-14 md:h-16 w-full items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-3 md:px-6 backdrop-blur-md glass">
            {/* Left: Greeting & Title */}
            <div className="flex items-center gap-4">
                <div className="hidden md:block">
                    <h2 className="text-lg font-bold tracking-tight text-slate-100">
                        {greeting}, <span className="text-slate-300 font-medium">{user.full_name.split(' ')[0]}</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        {currentTime.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <Badge variant="outline" className="hidden lg:flex gap-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sistema Operacional
                </Badge>
            </div>

            {/* Middle: Search Bar (Hidden on mobile) */}
            <div className="hidden md:flex flex-1 items-center justify-center px-6 max-w-md">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                    <Input
                        placeholder="Pesquisar amostras..."
                        className="h-10 w-full bg-slate-900 border-slate-700 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-emerald-500/50 glass hover:bg-slate-900 transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-300 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100 hover:bg-slate-900/50" asChild>
                    <Link href="/notifications">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                    </Link>
                </Button>

                <div className="h-6 w-px bg-slate-800 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative flex items-center gap-2 pl-2 pr-1 h-10 hover:bg-slate-900/50 text-slate-200">
                            <Avatar className="h-8 w-8 border border-slate-600">
                                <AvatarImage src="" alt={user.full_name} />
                                <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-bold uppercase">
                                    {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:flex flex-col items-start gap-0.5 pr-2">
                                <span className="text-xs font-bold text-slate-100 leading-none">{user.full_name}</span>
                                <span className="text-[10px] text-slate-400 leading-none uppercase tracking-widest font-semibold">{user.role}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-950 border-slate-800 glass" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-slate-100">{user.full_name}</p>
                                <p className="text-xs leading-none text-slate-400">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-900 focus:text-slate-100 cursor-pointer" asChild>
                            <Link href="/settings/profile" className="flex items-center w-full">
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-900 focus:text-slate-100 cursor-pointer" asChild>
                            <Link href="/settings" className="flex items-center w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <LogoutButton variant="menu" />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
