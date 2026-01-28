"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    MessageCircle,
    LogOut,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Receipt, label: "Expenses", href: "/dashboard/expenses" },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
    { icon: MessageCircle, label: "Chat Bot", href: "/dashboard/chat" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <div className="w-64 h-full bg-white/80 backdrop-blur-md border-r border-slate-200/60 flex flex-col p-4 relative z-20 shadow-lg shadow-slate-200/20">
            <div className="mb-8 px-4 flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">C</span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-foreground tracking-tighter">
                    CoinTrack
                </h1>
            </div>

            <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200",
                                isActive
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                    : "text-slate-600 hover:bg-white/60 hover:text-slate-800"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-rose-500 hover:bg-rose-100/50 transition-all duration-200"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
            </button>
        </div>
    );
}
