"use client";


import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Tag, FileText, IndianRupee } from "lucide-react";

interface Expense {
    id: string;
    amount: number;
    category: string;
    note?: string;
    date: Timestamp;
}

interface DailySpendListProps {
    expenses: Expense[];
}

export default function DailySpendList({ expenses }: DailySpendListProps) {
    // Default to today
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    });

    const filteredExpenses = useMemo(() => {
        if (!selectedDate) return [];

        return expenses.filter(exp => {
            const expDate = exp.date.toDate();
            const expDateStr = expDate.toISOString().split('T')[0];
            return expDateStr === selectedDate;
        });
    }, [expenses, selectedDate]);

    const dailyTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-8 shadow-lg transition-all dark:bg-card/80">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-foreground transition-colors">Detailed Daily Spend</h3>
                    <p className="text-muted-foreground text-sm transition-colors">Select a date to view transactions</p>
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-foreground focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedDate}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {filteredExpenses.length > 0 ? (
                        <div>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border transition-colors">
                                <span className="text-muted-foreground font-medium transition-colors">Total for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                <span className="text-xl font-bold text-foreground transition-colors">₹{dailyTotal.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group/card overflow-hidden relative"
                                    >
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                                <span className="font-bold text-blue-600 dark:text-primary transition-colors">{expense.category}</span>
                                            </div>
                                            <span className="font-bold text-foreground transition-colors">₹{expense.amount.toFixed(2)}</span>
                                        </div>

                                        {expense.note && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg relative z-10 transition-colors">
                                                <FileText className="w-3 h-3" />
                                                <span className="line-clamp-1">{expense.note}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border transition-colors">
                            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <h4 className="text-muted-foreground font-medium transition-colors">No expenses found</h4>
                            <p className="text-muted-foreground/60 text-sm transition-colors">You didn't record any spending on this date.</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
