"use client";

import { memo, useMemo, Suspense, lazy, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { doc, getDoc, collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, CreditCard, Target, ArrowUpRight, Receipt } from "lucide-react";

// Skeleton loader for charts
function ChartSkeleton() {
    return (
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-6 h-[350px]">
            <div className="h-6 w-40 bg-muted/60 rounded mb-4 animate-pulse" />
            <div className="h-full w-full bg-muted/40 rounded-2xl animate-pulse" />
        </div>
    );
}

// Lazy load heavy chart components
import dynamic from "next/dynamic";

// Force client-side rendering for Recharts to avoid hydration issues
const Charts = dynamic(() => import("@/components/dashboard-charts"), {
    ssr: false,
    loading: () => <ChartSkeleton />
});

interface Expense {
    id: string;
    amount: number;
    category: string;
    note?: string;
    date: Timestamp;
}

// Fast but smooth animation config
const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

// Memoized stat card
const StatCard = memo(function StatCard({
    label,
    value,
    icon: Icon,
    gradient,
    index
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    gradient: string;
    index: number;
}) {
    return (
        <motion.div
            variants={fadeInUp}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-200"
        >
            <div className={`absolute top-4 right-4 p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-muted-foreground text-sm mb-1 transition-colors">{label}</p>
            <h3 className="text-2xl font-bold text-foreground group-hover:scale-105 transition-all origin-left duration-200">
                {value}
            </h3>
        </motion.div>
    );
});

// Skeleton loader for charts


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<any[]>([]);
    const [recurring, setRecurring] = useState<any[]>([]); // New Recurring State
    const [loading, setLoading] = useState(true);

    // Fetch data
    useEffect(() => {
        if (authLoading || !user) return;

        // Real-time expenses
        const qStats = query(collection(db, "users", user.uid, "expenses"), orderBy("date", "desc"));
        const unsubStats = onSnapshot(qStats, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            setExpenses(data);
            setLoading(false);
        });

        // Real-time Incomes
        const qIncomes = query(collection(db, "users", user.uid, "incomes"), orderBy("year", "desc"), orderBy("month", "desc"));
        const unsubIncomes = onSnapshot(qIncomes, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setIncomes(data);
        });

        // Real-time Recurring
        const qRecs = query(collection(db, "users", user.uid, "recurring_expenses"));
        const unsubRecs = onSnapshot(qRecs, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecurring(data);
        });

        return () => {
            unsubStats();
            unsubIncomes();
            unsubRecs();
        };
    }, [user, authLoading]);

    // Calculate REAL stats from Firestore data
    const stats = useMemo(() => {
        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // One-time expenses for CURRENT MONTH
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyOneTime = expenses.filter(exp => {
            const expDate = exp.date.toDate();
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        }).reduce((sum, exp) => sum + exp.amount, 0);

        // RECURRING expenses (normalized to monthly) - ONLY IF ACTIVE THIS MONTH
        const monthlyRecurring = recurring.reduce((sum, item) => {
            const start = item.startDate?.toDate ? item.startDate.toDate() : new Date(0);
            const end = item.endDate?.toDate ? item.endDate.toDate() : null;

            // Create a date for the end of the current month to compare
            const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);

            // Item is active if:
            // 1. Start date is NOT in the future relative to the end of this month
            // 2. End date (if exists) is NOT in the past relative to the start of this month
            const isActive = start <= endOfCurrentMonth && (!end || end >= new Date(currentYear, currentMonth, 1));

            if (!isActive) return sum;

            if (item.frequency === "weekly") return sum + (item.amount * 4);
            if (item.frequency === "yearly") return sum + (item.amount / 12);
            return sum + item.amount;
        }, 0);

        const combinedMonthly = monthlyOneTime + monthlyRecurring;

        return [
            { label: "Total Expenses", value: `₹${totalSpent.toFixed(2)}`, icon: Wallet, gradient: "from-blue-500 to-indigo-500" },
            { label: "This Month (Total)", value: `₹${combinedMonthly.toFixed(2)}`, icon: ArrowUpRight, gradient: "from-emerald-400 to-teal-500" },
            { label: "Transactions", value: `${expenses.length}`, icon: CreditCard, gradient: "from-orange-400 to-rose-500" },
            { label: "Categories", value: `${new Set([...expenses.map(e => e.category), ...recurring.map(r => r.category)]).size}`, icon: Target, gradient: "from-violet-500 to-purple-600" },
        ];
    }, [expenses, recurring]);

    // Loading state
    if (authLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent"
                />
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
        >
            {/* Header */}
            <motion.div
                variants={fadeInUp}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex justify-between items-end"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground transition-colors">
                        Welcome, {user?.displayName || user?.email?.split('@')[0]} 👋
                    </h1>
                    <p className="text-muted-foreground mt-1 transition-colors">Your personal dashboard overview</p>
                </div>
                {expenses.length > 0 && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-card/80 backdrop-blur-sm border border-border px-4 py-2 rounded-2xl flex items-center gap-2 shadow-md transition-colors"
                    >
                        <Receipt className="w-4 h-4 text-primary" />
                        <span className="text-primary text-sm font-medium">{expenses.length} expenses tracked</span>
                    </motion.div>
                )}
            </motion.div>

            {/* Quick Stats Row - REAL DATA */}
            <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} {...stat} index={index} />
                ))}
            </motion.div>

            {/* Charts Section */}
            <motion.div variants={fadeInUp}>
                <Suspense fallback={<ChartSkeleton />}>
                    <Charts expenses={expenses} incomes={incomes} recurring={recurring} />
                </Suspense>
            </motion.div>



            {/* Categories */}
            {profile?.categories && (
                <motion.div
                    variants={fadeInUp}
                    className="pt-4"
                >
                    <h3 className="text-lg font-semibold text-foreground mb-4 transition-colors">Recommended Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.categories.map((cat: any, i: number) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                className="px-4 py-2 rounded-full bg-card/80 border border-border text-sm text-foreground shadow-sm cursor-default transition-all"
                            >
                                {cat.name}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
