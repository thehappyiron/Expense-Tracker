"use client";

import { useMemo, useState } from "react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Receipt, Check, Save } from "lucide-react";

interface Expense {
    id: string;
    amount: number;
    category: string;
    note?: string;
    date: Timestamp;
}

interface Income {
    id: string; // YYYY-MM
    amount: number;
    month: number;
    year: number;
}

interface DashboardChartsProps {
    expenses: Expense[];
    incomes: Income[];
    recurring: any[];
}

// Color palette for categories
const COLORS = ['#FF6B6B', '#4ECDC4', '#556EE6', '#FFA500', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export default function DashboardCharts({ expenses, incomes, recurring }: DashboardChartsProps) {
    const { user } = useAuth();
    const [incomeInput, setIncomeInput] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
    const [saving, setSaving] = useState(false);

    // Save income to Firestore
    const handleSaveIncome = async () => {
        if (!user || !incomeInput) return;
        setSaving(true);
        try {
            const year = new Date().getFullYear(); // Simplified for current year, could be expanded
            const docId = `${year}-${selectedMonth}`;
            await setDoc(doc(db, "users", user.uid, "incomes", docId), {
                amount: parseFloat(incomeInput),
                month: selectedMonth,
                year: year,
                updatedAt: Timestamp.now()
            });
            setIncomeInput("");
        } catch (error) {
            console.error("Error saving income:", error);
        } finally {
            setSaving(false);
        }
    };

    // Generate pie chart data from REAL expenses by category - TODAY ONLY
    const { pieData, todaysTotal } = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        const now = new Date();
        let total = 0;

        expenses.forEach(exp => {
            const expDate = exp.date.toDate();
            // Check if same day
            if (expDate.getDate() === now.getDate() &&
                expDate.getMonth() === now.getMonth() &&
                expDate.getFullYear() === now.getFullYear()) {

                const cat = exp.category || "Uncategorized";
                categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
                total += exp.amount;
            }
        });

        const data = Object.entries(categoryTotals)
            .map(([name, value], index) => ({
                name,
                value: Math.round(value * 100) / 100,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);

        return { pieData: data, todaysTotal: total };
    }, [expenses]);

    // Generate bar chart data - expenses by day (last 7 days)
    const barData = useMemo(() => {
        const now = new Date();
        const days: Record<string, { expense: number, income: number }> = {};

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toLocaleDateString('en-US', { weekday: 'short' });
            days[key] = { expense: 0, income: 0 };
        }

        // Sum expenses by day
        expenses.forEach(exp => {
            const expDate = exp.date.toDate();
            const daysDiff = Math.floor((now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
                const key = expDate.toLocaleDateString('en-US', { weekday: 'short' });
                if (days[key]) {
                    days[key].expense += exp.amount;
                }
            }
        });

        return Object.entries(days).map(([day, val]) => ({
            day,
            amount: Math.round(val.expense * 100) / 100
        }));
    }, [expenses]);

    // Monthly data for Tracking chart
    const monthlyData = useMemo(() => {
        const monthTotals: Record<string, { expense: number; income: number }> = {};
        const now = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const key = date.toLocaleDateString('en-US', { month: 'short' });

            // Calculate recurring active for THIS specific month
            const monthlyRecurringValue = recurring?.reduce((sum, item) => {
                // ERASE FROM PAST MONTHS: Only show recurring starting from Jan 2026
                if (startOfMonth < new Date(2026, 0, 1)) return 0;

                const start = item.startDate?.toDate ? item.startDate.toDate() : new Date(2026, 0, 1);
                const end = item.endDate?.toDate ? item.endDate.toDate() : null;

                const isActive = start <= endOfMonth && (!end || end >= startOfMonth);
                if (!isActive) return sum;

                if (item.frequency === "weekly") return sum + (item.amount * 4);
                if (item.frequency === "yearly") return sum + (item.amount / 12);
                return sum + item.amount;
            }, 0) || 0;

            monthTotals[key] = { expense: monthlyRecurringValue, income: 0 };
        }

        expenses.forEach(exp => {
            const expDate = exp.date.toDate();
            const key = expDate.toLocaleDateString('en-US', { month: 'short' });
            if (monthTotals[key]) {
                monthTotals[key].expense += exp.amount;
            }
        });

        // Add Income Data
        incomes.forEach(inc => {
            const date = new Date(inc.year, inc.month, 1);
            const key = date.toLocaleDateString('en-US', { month: 'short' });
            if (monthTotals[key]) {
                monthTotals[key].income = inc.amount;
            }
        });

        return Object.entries(monthTotals).map(([name, val]) => ({
            name,
            amount: Math.round(val.expense * 100) / 100,
            income: Math.round(val.income * 100) / 100
        }));
    }, [expenses, incomes, recurring]);


    // Empty state
    if (expenses.length === 0 && incomes.length === 0) {
        return (
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-12 text-center shadow-lg transition-colors">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground transition-colors">Add expenses or income to see charts</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 hidden-scrollbar">
            {/* Left Column: Expense Structure & Income Input */}
            <div className="flex flex-col gap-8">
                {/* Expense Structure - Donut Chart */}
                <div className="bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col transition-colors">
                    <h3 className="text-lg font-bold text-foreground mb-2 transition-colors">Today's Expense Structure</h3>

                    {/* Big Daily Total Display */}
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground text-sm font-medium mb-1 transition-colors">Your Today's Expense Is</p>
                        <h2 className="text-4xl font-extrabold text-foreground tracking-tight transition-colors">
                            ₹{todaysTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                    </div>

                    <div className="w-full h-[220px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                                    labelStyle={{ color: 'var(--foreground)' }}
                                    formatter={(value: any, name: any) => [`₹${Number(value || 0).toFixed(2)}`, String(name || "")]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-col gap-3">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm group cursor-default">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div
                                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors truncate">
                                        {entry.name}
                                    </span>
                                </div>
                                <span className="font-bold text-foreground flex-shrink-0 ml-2 transition-colors">
                                    ₹{entry.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        {pieData.length === 0 && (
                            <div className="text-center py-4 bg-muted rounded-2xl border border-dashed border-border transition-colors">
                                <p className="text-muted-foreground text-sm">No expenses yet today</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Income Input Card */}
                <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm transition-colors">
                    <h3 className="text-sm font-bold text-foreground mb-3">Set Monthly Income</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <input
                                type="number"
                                placeholder="Salary"
                                value={incomeInput}
                                onChange={(e) => setIncomeInput(e.target.value)}
                                className="w-full bg-muted border border-border rounded-xl pl-7 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleSaveIncome}
                            disabled={!incomeInput || saving}
                            className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center sm:w-auto"
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                    </div>
                    {/* Show current set income for selected month */}
                    <div className="mt-2 text-xs text-muted-foreground text-right transition-colors">
                        Current: <span className="font-medium text-foreground">₹{incomes.find(i => i.month === selectedMonth && i.year === new Date().getFullYear())?.amount.toFixed(2) || '0.00'}</span>
                    </div>
                </div>
            </div>

            {/* Right Column - Stacked Charts */}
            <div className="lg:col-span-2 flex flex-col gap-8">

                {/* 1. Focusing - Expenses Only (Daily) */}
                <div className="bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm h-[400px] transition-colors">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-foreground transition-colors">Focusing</h3>
                        <p className="text-muted-foreground text-sm transition-colors">Daily Expenses Trends</p>
                    </div>

                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 13, fontWeight: 'bold', fill: 'var(--foreground)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 13, fontWeight: 'bold', fill: 'var(--foreground)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `₹${v}`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                                    labelStyle={{ color: 'var(--foreground)' }}
                                    formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(2)}`, 'Spent']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#ff6b6b"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Tracking - Income vs Expenses (Monthly) */}
                <div className="bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm h-[400px] transition-colors">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-foreground transition-colors">Income vs Expense Tracking</h3>
                        <p className="text-muted-foreground text-sm transition-colors">Monthly Overview</p>
                    </div>

                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorExpenseTracking" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIncomeTracking" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fontWeight: 'bold', fill: 'var(--muted-foreground)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fontWeight: 'bold', fill: 'var(--muted-foreground)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `₹${v}`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                                    labelStyle={{ color: 'var(--foreground)' }}
                                    formatter={(value: any, name: any) => [`₹${(value || 0).toFixed(2)}`, name === 'income' ? 'Income' : 'Expenses']}
                                />
                                {/* Income Area */}
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense2)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
