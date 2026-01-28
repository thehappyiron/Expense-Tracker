"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";
import DailySpendList from "@/components/daily-spend-list";
import MonthlySpendList from "@/components/monthly-spend-list";
import BudgetTracker from "@/components/budget-tracker";

interface Expense {
    id: string;
    amount: number;
    category: string;
    note?: string;
    date: Timestamp;
}

interface RecurringExpense {
    id: string;
    amount: number;
    category: string;
    frequency: string;
    startDate: Timestamp;
    endDate?: Timestamp | null;
}

// Color palette
const COLORS = ['#FF6B6B', '#4ECDC4', '#556EE6', '#FFA500', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data from Firestore
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // One-time expenses
        const qExp = query(collection(db, "users", user.uid, "expenses"), orderBy("date", "desc"));
        const unsubExp = onSnapshot(qExp, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
            setExpenses(data);
        });

        // Recurring expenses
        const qRec = query(collection(db, "users", user.uid, "recurring_expenses"));
        const unsubRec = onSnapshot(qRec, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecurringExpense[];
            setRecurring(data);
            setLoading(false);
        });

        return () => {
            unsubExp();
            unsubRec();
        };
    }, [user]);

    // Calculate REAL stats
    const stats = useMemo(() => {
        const totalOneTime = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Normalized monthly recurring - ONLY ACTIVE NOW
        const monthlyRecurring = recurring.reduce((sum, item) => {
            const start = item.startDate?.toDate ? item.startDate.toDate() : new Date(0);
            const end = item.endDate?.toDate ? item.endDate.toDate() : null;
            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const isActive = start <= endOfCurrentMonth && (!end || end >= startOfCurrentMonth);
            if (!isActive) return sum;

            if (item.frequency === "weekly") return sum + (item.amount * 4);
            if (item.frequency === "yearly") return sum + (item.amount / 12);
            return sum + item.amount;
        }, 0);

        // Active days for average calculation
        let daysActive = 1;
        if (expenses.length > 0) {
            const firstStoreDate = expenses[expenses.length - 1].date.toDate();
            const now = new Date();
            const start = new Date(firstStoreDate.getFullYear(), firstStoreDate.getMonth(), firstStoreDate.getDate());
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffTime = Math.abs(end.getTime() - start.getTime());
            daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const avgDaily = totalOneTime / Math.max(1, daysActive);

        return {
            totalExpenses: totalOneTime + monthlyRecurring, // Holistic total (one-time + monthly commitments)
            avgDaily,
            transactionCount: expenses.length,
            monthlyRecurring
        };
    }, [expenses, recurring]);

    // Generate pie data (Combining one-time and recurring categories)
    const pieData = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        // One-time
        expenses.forEach(exp => {
            const cat = exp.category || "Uncategorized";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
        });

        // Recurring (monthly equivalent) - ONLY ACTIVE NOW
        recurring.forEach(item => {
            const start = item.startDate?.toDate ? item.startDate.toDate() : new Date(0);
            const end = item.endDate?.toDate ? item.endDate.toDate() : null;
            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const isActive = start <= endOfCurrentMonth && (!end || end >= startOfCurrentMonth);
            if (!isActive) return;

            const cat = item.category || "Bills";
            let monthlyAmount = item.amount;
            if (item.frequency === "weekly") monthlyAmount = item.amount * 4;
            if (item.frequency === "yearly") monthlyAmount = item.amount / 12;

            categoryTotals[cat] = (categoryTotals[cat] || 0) + monthlyAmount;
        });

        return Object.entries(categoryTotals)
            .map(([name, value], index) => ({
                name,
                value: Math.round(value * 100) / 100,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
    }, [expenses, recurring]);

    // Generate monthly data (Adding recurring to EACH month)
    const monthlyData = useMemo(() => {
        const monthTotals: Record<string, number> = {};
        const now = new Date();

        // 1. Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const key = date.toLocaleDateString('en-US', { month: 'short' });

            // Calculate recurring active for THIS specific month
            const monthlyRecurringForPeriod = recurring.reduce((sum, item) => {
                // ERASE FROM PAST MONTHS: Only show recurring starting from Jan 2026
                if (startOfMonth < new Date(2026, 0, 1)) return 0;

                const start = item.startDate?.toDate ? item.startDate.toDate() : new Date(2026, 0, 1);
                const end = item.endDate?.toDate ? item.endDate.toDate() : null;

                const isActive = start <= endOfMonth && (!end || end >= startOfMonth);
                if (!isActive) return sum;

                if (item.frequency === "weekly") return sum + (item.amount * 4);
                if (item.frequency === "yearly") return sum + (item.amount / 12);
                return sum + item.amount;
            }, 0);

            monthTotals[key] = monthlyRecurringForPeriod;
        }

        // 3. Add one-time expenses
        expenses.forEach(exp => {
            const expDate = exp.date.toDate();
            const key = expDate.toLocaleDateString('en-US', { month: 'short' });
            if (monthTotals[key] !== undefined) {
                monthTotals[key] += exp.amount;
            }
        });

        return Object.entries(monthTotals).map(([month, expenses]) => ({
            month,
            expenses: Math.round(expenses * 100) / 100
        }));
    }, [expenses, recurring]);

    // Loading state
    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    // Empty state
    if (expenses.length === 0) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground mt-1">Deep dive into your financial trends</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-12 text-center shadow-lg">
                    <Receipt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Data Yet</h3>
                    <p className="text-muted-foreground text-sm">Add expenses to see your analytics</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground transition-colors">Analytics</h1>
                <p className="text-muted-foreground mt-1 transition-colors">Deep dive into your financial trends</p>
            </div>

            {/* Summary Cards - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Expenses", value: `₹${stats.totalExpenses.toFixed(2)}`, icon: DollarSign, gradient: "from-rose-400 to-orange-500", cardBg: "bg-card/50", cardBorder: "border-border" },
                    { label: "Avg. Daily Spend", value: `₹${stats.avgDaily.toFixed(2)}`, icon: Calendar, gradient: "from-emerald-400 to-teal-500", cardBg: "bg-card/50", cardBorder: "border-border" },
                    { label: "Transactions", value: `${stats.transactionCount}`, icon: TrendingUp, gradient: "from-blue-500 to-indigo-600", cardBg: "bg-card/50", cardBorder: "border-border" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`${stat.cardBg} backdrop-blur-sm border border-border rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-sm transition-colors">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-foreground mt-1 transition-colors">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* Expense Breakdown - PIE */}
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-lg min-w-0 transition-colors" style={{ isolation: 'isolate' }}>
                    <h3 className="text-lg font-semibold text-foreground mb-4 transition-colors">Expense Breakdown</h3>
                    <div className="relative z-30" style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 100 }}
                                    formatter={(value: any, name: any) => [`₹${Number(value || 0).toFixed(2)}`, String(name || "")]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 justify-center relative z-30">
                        {pieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-muted-foreground transition-colors">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Spending - BAR */}
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-lg min-w-0 transition-colors" style={{ isolation: 'isolate' }}>
                    <h3 className="text-lg font-semibold text-foreground mb-4 transition-colors">Monthly Spending</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(2)}`, 'Spent']}
                                />
                                <Bar dataKey="expenses" name="Expenses" fill="#556EE6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Budget Tracker Section */}
            <BudgetTracker expenses={expenses} />

            {/* Detailed Daily Spend Section */}
            <DailySpendList expenses={expenses} />

            {/* Detailed Monthly Spend Section */}
            <MonthlySpendList expenses={expenses} recurring={recurring} />
        </div>
    );
}
