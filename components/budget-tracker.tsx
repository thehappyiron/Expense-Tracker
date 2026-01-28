"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import {
    Pencil, Save, Plus, AlertCircle, CheckCircle2,
    Utensils, ShoppingBag, Car, Home, Zap,
    Smartphone, Coffee, Plane, Heart, HelpCircle
} from "lucide-react";

interface Expense {
    id: string;
    amount: number;
    category: string;
    date: Timestamp;
}

interface BudgetTrackerProps {
    expenses: Expense[];
}

// Icon mapping helper
const getCategoryIcon = (category: string) => {
    const key = category.toLowerCase();
    if (key.includes('food') || key.includes('rest')) return Utensils;
    if (key.includes('shop') || key.includes('cloth')) return ShoppingBag;
    if (key.includes('trans') || key.includes('car') || key.includes('fuel')) return Car;
    if (key.includes('home') || key.includes('rent')) return Home;
    if (key.includes('util') || key.includes('elec')) return Zap;
    if (key.includes('phone') || key.includes('mobile')) return Smartphone;
    if (key.includes('lunch') || key.includes('snack')) return Coffee;
    if (key.includes('travel') || key.includes('trip')) return Plane;
    if (key.includes('health') || key.includes('med')) return Heart;
    return HelpCircle;
};

export default function BudgetTracker({ expenses }: BudgetTrackerProps) {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<Record<string, number>>({});
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newLimit, setNewLimit] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth()}`;
    });

    // Fetch budgets
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "users", user.uid, "settings_data", "budgets"), (doc) => {
            if (doc.exists()) {
                setBudgets(doc.data() as Record<string, number>);
            }
        });
        return () => unsub();
    }, [user]);

    // Filter expenses & Calculate Status
    const monthlyMetrics = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const totals: Record<string, number> = {};

        expenses.forEach(exp => {
            const d = exp.date.toDate();
            if (d.getFullYear() === year && d.getMonth() === month) {
                const cat = exp.category || "Uncategorized";
                totals[cat] = (totals[cat] || 0) + exp.amount;
            }
        });

        const allCategories = Array.from(new Set([...Object.keys(totals), ...Object.keys(budgets)]));

        return allCategories.map(cat => {
            const spent = totals[cat] || 0;
            const limit = budgets[cat] || 0;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;

            let status: "safe" | "warning" | "exceeded" = "safe";
            if (limit > 0) {
                if (percentage >= 100) status = "exceeded";
                else if (percentage >= 80) status = "warning";
            }

            return { category: cat, spent, limit, percentage, status };
        }).sort((a, b) => {
            // Sort: Exceeded > Warning > Safe, then by %
            const score = (item: any) => {
                if (item.status === 'exceeded') return 300 + item.percentage;
                if (item.status === 'warning') return 200 + item.percentage;
                return item.percentage;
            };
            return score(b) - score(a);
        });
    }, [expenses, budgets, selectedMonth]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveBudget = async (category: string) => {
        if (!user) return;
        const limit = parseFloat(newLimit);
        if (isNaN(limit) || limit < 0) return;

        setIsSaving(true);
        try {
            await setDoc(doc(db, "users", user.uid, "settings_data", "budgets"), { [category]: limit }, { merge: true });
            console.log(`✅ Budget for ${category} updated`);
            setEditingCategory(null);
            setNewLimit("");
        } catch (error: any) {
            console.error("❌ Error saving budget:", error);
            alert(`Failed to save budget: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case "exceeded": return "#ef4444"; // red-500
            case "warning": return "#f59e0b"; // amber-500
            default: return "#10b981"; // emerald-500
        }
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] p-6 md:p-8 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-foreground transition-colors">Monthly Budgets</h3>
                    <p className="text-muted-foreground text-sm transition-colors">Visualize your spending limits</p>
                </div>

                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-muted border border-border text-foreground text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors"
                >
                    {Array.from({ length: 12 }).map((_, i) => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - i);
                        const value = `${d.getFullYear()}-${d.getMonth()}`;
                        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return <option key={value} value={value}>{label}</option>
                    })}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {monthlyMetrics.map((item) => {
                    const Icon = getCategoryIcon(item.category);
                    const color = getStatusColor(item.status);
                    const radius = 36;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (Math.min(item.percentage, 100) / 100) * circumference;

                    return (
                        <div key={item.category} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            {/* Background Status Glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-current opacity-5 rounded-bl-full pointer-events-none" style={{ color }} />

                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                {editingCategory === item.category ? (
                                    <div className="flex items-center gap-1 animate-in slide-in-from-right duration-200">
                                        <input
                                            autoFocus
                                            disabled={isSaving}
                                            type="number"
                                            className="w-16 px-1 py-0.5 text-xs bg-muted border border-border text-foreground rounded focus:outline-none focus:border-primary disabled:opacity-50"
                                            value={newLimit}
                                            onChange={(e) => setNewLimit(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget(item.category)}
                                        />
                                        <button
                                            onClick={() => handleSaveBudget(item.category)}
                                            disabled={isSaving}
                                            className="text-emerald-500 hover:bg-emerald-50 rounded p-1 disabled:opacity-50"
                                        >
                                            {isSaving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setEditingCategory(item.category); setNewLimit(item.limit ? item.limit.toString() : ""); }}
                                        className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Circular Progress */}
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r={radius}
                                            stroke="#f1f5f9"
                                            strokeWidth="6"
                                            fill="none"
                                        />
                                        {item.limit > 0 && (
                                            <motion.circle
                                                cx="40"
                                                cy="40"
                                                r={radius}
                                                stroke={color}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                fill="none"
                                                strokeDasharray={circumference}
                                                initial={{ strokeDashoffset: circumference }}
                                                animate={{ strokeDashoffset }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        )}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                                        {item.limit > 0 ? `${Math.round(item.percentage)}%` : 'N/A'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground truncate mb-1">{item.category}</h4>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-foreground transition-colors">₹{item.spent.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground transition-colors">
                                            of ₹{item.limit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Alert Message */}
                            {item.limit > 0 && item.percentage >= 80 && (
                                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium animate-pulse" style={{ color }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {item.percentage >= 100 ? 'Exceeded Budget!' : 'Approaching Limit'}
                                </div>
                            )}
                        </div>
                    );
                })}

                {monthlyMetrics.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/50 rounded-3xl border border-dashed border-border transition-colors">
                        <p>No activity found for this month.</p>
                    </div>
                )}

                {/* Add Custom Category Card could go here */}
            </div>
        </div>
    );
}
