"use client";

import { NavBar } from "@/components/ui/tubelight-navbar";
import { QuickAddExpense } from "@/components/quick-add-expense";
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    MessageCircle,
} from "lucide-react";

const navItems = [
    { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { name: "Expenses", url: "/dashboard/expenses", icon: Receipt },
    { name: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    { name: "Chat", url: "/dashboard/chat", icon: MessageCircle },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:bg-none dark:bg-background text-slate-800 dark:text-foreground relative transition-colors">
            {/* Optimized Background - restored light mode colors, dark mode overrides via dark: */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden will-change-transform">
                <div className="absolute top-[-10%] left-[5%] w-[400px] h-[400px] bg-gradient-to-br from-orange-200/20 to-rose-200/20 dark:from-primary/20 dark:to-orange-500/10 blur-3xl dark:blur-[100px] rounded-full dark:opacity-10" />
                <div className="absolute top-[30%] right-[0%] w-[350px] h-[350px] bg-gradient-to-br from-cyan-200/20 to-blue-200/20 dark:from-blue-500/10 dark:to-primary/10 blur-3xl dark:blur-[100px] rounded-full dark:opacity-10" />
                <div className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] bg-gradient-to-br from-violet-200/15 to-fuchsia-200/15 dark:from-violet-500/10 dark:to-fuchsia-500/10 blur-3xl dark:blur-[120px] rounded-full dark:opacity-10" />
            </div>

            <NavBar items={navItems} />
            <main className="pt-24 pb-8 px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>

                <QuickAddExpense />
            </main>
        </div>
    );
}
