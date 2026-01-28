"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, addDoc, deleteDoc, updateDoc, Timestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
    RefreshCcw, Plus, Trash2, Pencil, X, Check,
    Calendar, IndianRupee, Bell, AlertCircle, ShoppingBag,
    Car, Heart, Home, Zap, HeartPulse, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecurringExpense {
    id: string;
    name: string;
    amount: number;
    category: string;
    frequency: "monthly" | "weekly" | "yearly";
    startDate: Timestamp;
    endDate?: Timestamp;
    nextDate: Timestamp;
    lastProcessed?: Timestamp;
}

export default function RecurringExpenses() {
    const { user } = useAuth();
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Bills");
    const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "recurring_expenses"),
            orderBy("nextDate", "asc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RecurringExpense[];
            setRecurring(data);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name || !amount || !startDate) return;

        setIsSaving(true);
        try {
            const start = new Date(startDate);
            // If starting in future, nextDate is startDate
            // If starting in past, we'll assume the next billing is based on the cycle
            // Simplified: Just set nextDate to start date for now
            const nextDate = new Date(start);

            await addDoc(collection(db, "users", user.uid, "recurring_expenses"), {
                name,
                amount: parseFloat(amount),
                category,
                frequency,
                startDate: Timestamp.fromDate(start),
                endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
                nextDate: Timestamp.fromDate(nextDate),
                createdAt: Timestamp.now()
            });

            setName("");
            setAmount("");
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate("");
            setShowAddModal(false);
        } catch (error) {
            console.error("Error adding recurring expense:", error);
            alert("Failed to add recurring expense");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Remove this recurring expense?")) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "recurring_expenses", id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-foreground flex items-center gap-2 transition-colors">
                    <RefreshCcw className="w-5 h-5 text-blue-500 dark:text-primary" />
                    Recurring & Subscriptions
                </h2>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 dark:bg-primary text-white dark:text-primary-foreground hover:opacity-90 rounded-xl px-4 py-2 flex items-center gap-2 h-10 transition-all font-bold"
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurring.length === 0 && !loading ? (
                    <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-muted/40 rounded-3xl border border-dashed border-slate-200 dark:border-border transition-colors">
                        <Bell className="w-12 h-12 text-slate-300 dark:text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-muted-foreground font-medium">No recurring expenses found.</p>
                        <p className="text-xs text-slate-400 dark:text-muted-foreground/60 mt-1">Add items like Rent, Netflix, or Gym memberships.</p>
                    </div>
                ) : (
                    recurring.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary rounded-xl transition-colors">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-slate-300 dark:text-muted-foreground/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h4 className="font-bold text-slate-800 dark:text-foreground text-lg mb-1 transition-colors">{item.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-muted-foreground mb-4 transition-colors">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-muted rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-muted-foreground/80">
                                    {item.frequency}
                                </span>
                                <span>•</span>
                                <span>{item.category}</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-black text-slate-800 dark:text-foreground transition-colors">₹{item.amount.toLocaleString()}</span>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold transition-colors">Next Date</p>
                                    <p className="text-xs font-semibold text-slate-600 transition-colors">
                                        {item.nextDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-8 w-full max-w-md shadow-2xl transition-colors"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-foreground transition-colors">New Recurring Expense</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-500 dark:text-muted-foreground" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest block mb-2 px-1 transition-colors">Expense Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Netflix, Monthly Rent"
                                        className="w-full bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-2xl py-3.5 px-5 text-slate-700 dark:text-foreground focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-primary/10 focus:border-blue-500/50 dark:focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest block mb-2 px-1 transition-colors">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground font-bold">₹</span>
                                            <input
                                                required
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-2xl py-3.5 pl-9 pr-5 text-slate-800 dark:text-foreground font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-primary/10 focus:border-blue-500/50 dark:focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest block mb-2 px-1 transition-colors">Frequency</label>
                                        <select
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value as any)}
                                            className="w-full bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-2xl py-3.5 px-4 text-slate-700 dark:text-foreground font-medium focus:outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-primary/10 transition-all cursor-pointer"
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest block mb-2 px-1 transition-colors">Start Date</label>
                                        <input
                                            required
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-2xl py-3 px-4 text-slate-700 dark:text-foreground font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-primary/10 focus:border-blue-500/50 dark:focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 dark:text-muted-foreground/40 uppercase tracking-widest block mb-2 px-1 transition-colors">End Date (Opt)</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-muted/60 border border-slate-200 dark:border-border rounded-2xl py-3 px-4 text-slate-700 dark:text-muted-foreground/80 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-primary/10 focus:border-blue-500/50 dark:focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest block mb-2 px-1 transition-colors">Category</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["Bills", "Home", "Health", "Food", "Entertainment", "Other"].map((cat) => (
                                            <button
                                                type="button"
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border ${category === cat
                                                    ? "bg-blue-600 dark:bg-primary border-blue-600 dark:border-primary text-white dark:text-primary-foreground shadow-lg shadow-blue-500/20 dark:shadow-primary/20"
                                                    : "bg-white dark:bg-muted border-slate-100 dark:border-border text-slate-500 dark:text-muted-foreground hover:border-slate-300 dark:hover:border-muted-foreground"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full py-7 bg-gradient-to-r from-blue-600 to-indigo-600 dark:bg-none dark:bg-primary text-white dark:text-primary-foreground hover:from-blue-700 hover:to-indigo-700 dark:hover:opacity-90 font-bold dark:font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 dark:shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                    >
                                        {isSaving ? "Adding..." : "Add Recurring Expense"}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 dark:text-muted-foreground mt-4 px-4 transition-colors">
                                        Note: We'll show these separately so you can track your committed spending.
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
