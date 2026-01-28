"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Tag, FileText, IndianRupee, RefreshCcw, LayoutList, ShoppingBag, Trash2 } from "lucide-react";

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
    name?: string;
    nextDate?: Timestamp;
}

interface MonthlySpendListProps {
    expenses: Expense[];
    recurring: RecurringExpense[];
}

export default function MonthlySpendList({ expenses, recurring }: MonthlySpendListProps) {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const filteredData = useMemo(() => {
        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

        // 1. One-time expenses for this month
        const oneTimeItems = expenses.filter(exp => {
            const d = exp.date.toDate();
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        // 2. Recurring expenses active this month
        const recurringItems = recurring.filter(item => {
            // Respect the "Jan 2026 onwards" rule for recurring
            if (startOfMonth < new Date(2026, 0, 1)) return false;

            const start = item.startDate?.toDate ? item.startDate.toDate() : new Date(2026, 0, 1);
            const end = item.endDate?.toDate ? item.endDate.toDate() : null;

            return start <= endOfMonth && (!end || end >= startOfMonth);
        }).map(item => {
            // Normalize amount to monthly for the display if needed, 
            // but usually we just want to list the commitment
            let displayAmount = item.amount;
            if (item.frequency === "weekly") displayAmount = item.amount * 4;
            if (item.frequency === "yearly") displayAmount = item.amount / 12;

            return {
                ...item,
                displayAmount
            };
        });

        const totalOneTime = oneTimeItems.reduce((sum, item) => sum + item.amount, 0);
        const totalRecurring = recurringItems.reduce((sum, item) => sum + item.displayAmount, 0);

        return {
            oneTimeItems,
            recurringItems,
            totalOneTime,
            totalRecurring,
            grandTotal: totalOneTime + totalRecurring
        };
    }, [expenses, recurring, selectedMonth, selectedYear]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const yearOptions = [2024, 2025, 2026];

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-8 shadow-lg mt-8 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-foreground transition-colors">Detailed Monthly Spend</h3>
                    <p className="text-muted-foreground text-sm transition-colors">Full breakdown of regular and recurring costs</p>
                </div>

                <div className="flex gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-muted border border-border rounded-xl px-3 py-2 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        {months.map((month, idx) => (
                            <option key={month} value={idx}>{month}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-muted border border-border rounded-xl px-3 py-2 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-between items-center mb-8 p-6 bg-muted/30 rounded-2xl border border-border transition-colors">
                <div>
                    <p className="text-muted-foreground text-sm font-medium transition-colors">Grand Total for {months[selectedMonth]} {selectedYear}</p>
                    <h4 className="text-3xl font-black text-foreground mt-1 transition-colors">₹{filteredData.grandTotal.toFixed(2)}</h4>
                </div>
                <LayoutList className="w-10 h-10 text-primary/20" />
            </div>

            <div className="space-y-8">
                {/* Recurring Section */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-primary uppercase tracking-widest mb-4 px-1 transition-colors">
                        <RefreshCcw className="w-4 h-4" />
                        Subscriptions & Recurring
                    </h4>
                    {filteredData.recurringItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredData.recurringItems.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary rounded-xl transition-colors">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <h4 className="font-bold text-blue-600 dark:text-primary text-lg mb-1 transition-colors">{item.name || "Recurring Item"}</h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-muted-foreground mb-4 transition-colors">
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-muted rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-muted-foreground/80">
                                            {item.frequency}
                                        </span>
                                        <span className="text-blue-600 dark:text-primary">•</span>
                                        <span>{item.category}</span>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <span className="text-2xl font-black text-slate-800 dark:text-foreground transition-colors">₹{item.displayAmount.toLocaleString()}</span>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-bold transition-colors">Next Date</p>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-muted-foreground/80 transition-colors">
                                                {item.nextDate ? item.nextDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm italic px-1">No active subscriptions for this month.</p>
                    )}
                </div>

                {/* One-time Section */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-primary uppercase tracking-widest mb-4 px-1 transition-colors">
                        <IndianRupee className="w-4 h-4" />
                        One-time Expenses
                    </h4>
                    {filteredData.oneTimeItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredData.oneTimeItems.map((expense) => (
                                <div key={expense.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm group hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-blue-600 dark:text-primary transition-colors">{expense.category}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5 transition-colors">
                                                {expense.date.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <span className="font-bold text-foreground transition-colors">₹{expense.amount.toFixed(2)}</span>
                                    </div>
                                    {expense.note && (
                                        <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded-lg line-clamp-1 italic transition-colors">
                                            "{expense.note}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm italic px-1">No one-time expenses recorded for this month.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
