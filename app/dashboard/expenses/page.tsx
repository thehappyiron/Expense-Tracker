"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Calendar, Tag, Trash2, IndianRupee, Pencil, X, Save, RefreshCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecurringExpenses from "@/components/recurring-expenses";

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
    frequency: string;
    startDate: Timestamp;
    endDate?: Timestamp | null;
}

export default function ExpensesPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"recent" | "recurring">("recent");

    // Edit State
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editNote, setEditNote] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Real-time one-time expenses
        const qExpenses = query(
            collection(db, "users", user.uid, "expenses"),
            orderBy("date", "desc")
        );
        const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Expense[];
            setExpenses(data);
        });

        // Real-time recurring expenses
        const qRecs = query(collection(db, "users", user.uid, "recurring_expenses"));
        const unsubRecs = onSnapshot(qRecs, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as RecurringExpense[];
            setRecurring(data);
            setLoading(false);
        });

        return () => {
            unsubExpenses();
            unsubRecs();
        };
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Are you sure you want to delete this expense?")) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "expenses", id));
        } catch (error) {
            console.error("Error deleting expense:", error);
            alert("Failed to delete expense");
        }
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setEditAmount(expense.amount.toString());
        setEditCategory(expense.category);
        setEditNote(expense.note || "");
    };

    const handleUpdate = async () => {
        if (!user || !editingExpense) return;

        const amount = parseFloat(editAmount);
        if (isNaN(amount)) {
            alert("Please enter a valid amount");
            return;
        }

        setUpdating(true);

        // Timeout promise to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Database operation timed out. Please check your connection.")), 10000)
        );

        try {
            console.log("🔄 Attempting update for expense:", editingExpense.id);

            // Race the update against a 10s timeout
            await Promise.race([
                updateDoc(doc(db, "users", user.uid, "expenses", editingExpense.id), {
                    amount: amount,
                    category: editCategory,
                    note: editNote,
                    updatedAt: Timestamp.now()
                }),
                timeoutPromise
            ]);

            console.log("✅ Update resolved successfully");
        } catch (error: any) {
            console.error("❌ Save Error:", error);
            // If it timed out, but we are offline, Firebase will actually sync it later
            // but we should still unstick the UI.
            alert(error.message || "Failed to save changes. Please try again.");
        } finally {
            setUpdating(false);
            setEditingExpense(null);
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // CALCULATIONS
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. One-time expenses for CURRENT MONTH
    const monthlyOneTime = expenses.filter(exp => {
        const d = exp.date.toDate();
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, exp) => sum + exp.amount, 0);

    // 2. All recurring expenses (normalized to monthly) - ONLY IF ACTIVE THIS MONTH
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
        return sum + item.amount; // default monthly
    }, 0);

    const combinedMonthlyTotal = monthlyOneTime + monthlyRecurring;

    return (
        <div className="space-y-8 relative">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-foreground transition-colors">Expenses</h1>
                    <p className="text-slate-500 dark:text-muted-foreground mt-1 transition-colors">Track and manage your spending</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border border-border px-6 py-3 rounded-2xl shadow-md transition-colors">
                        <p className="text-sm text-slate-500 dark:text-muted-foreground transition-colors">Monthly Total (Incl. Recurring)</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-foreground transition-colors">₹{combinedMonthlyTotal.toFixed(2)}</p>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100/50 dark:bg-muted/50 backdrop-blur-sm rounded-2xl w-fit border border-border transition-colors">
                <button
                    onClick={() => setActiveTab("recent")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "recent"
                        ? "bg-white dark:bg-card text-blue-600 dark:text-primary shadow-md shadow-slate-200/50 dark:shadow-primary/10"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                        }`}
                >
                    <History className="w-4 h-4" />
                    One-time Expenses
                </button>
                <button
                    onClick={() => setActiveTab("recurring")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "recurring"
                        ? "bg-white dark:bg-card text-blue-600 dark:text-primary shadow-md shadow-slate-200/50 dark:shadow-primary/10"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                        }`}
                >
                    <RefreshCcw className="w-4 h-4" />
                    Recurring & Rent
                </button>
            </div>

            {/* Content Area */}
            {activeTab === "recurring" ? (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <RecurringExpenses />
                </motion.div>
            ) : (
                <>
                    {/* Expenses List */}
                    {expenses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border border-slate-200/60 dark:border-border rounded-3xl p-12 text-center shadow-lg transition-colors"
                        >
                            <Receipt className="w-16 h-16 text-slate-300 dark:text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground mb-2">No Expenses Yet</h3>
                            <p className="text-slate-500 dark:text-muted-foreground text-sm">Click the + button to add your first expense</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/80 dark:bg-card border border-border rounded-3xl shadow-lg overflow-hidden transition-colors"
                        >
                            <div className="divide-y divide-slate-100 dark:divide-border">
                                {expenses.map((expense, i) => (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex items-center justify-between p-5 hover:bg-white/40 dark:hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:bg-none dark:bg-primary/10">
                                                <IndianRupee className="w-5 h-5 text-blue-600 dark:text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-foreground transition-colors">{expense.category}</p>
                                                {expense.note && (
                                                    <p className="text-sm text-slate-500 dark:text-muted-foreground transition-colors">{expense.note}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-muted-foreground/60 mt-1 transition-colors">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatDate(expense.date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-lg font-bold text-slate-800 dark:text-foreground transition-colors">
                                                ₹{expense.amount.toFixed(2)}
                                            </p>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(expense)}
                                                    className="h-8 w-8 text-slate-400 dark:text-muted-foreground hover:text-blue-500 dark:hover:text-primary transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="h-8 w-8 text-slate-400 dark:text-muted-foreground hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Edit Modal */}
                    <AnimatePresence>
                        {editingExpense && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-card border border-border rounded-3xl shadow-xl p-6 w-full max-w-md transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-foreground">Edit Expense</h3>
                                        <button
                                            onClick={() => setEditingExpense(null)}
                                            className="p-2 hover:bg-muted rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="w-full bg-muted border border-border rounded-xl py-3 pl-10 pr-4 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="0.00"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Food", "Transport", "Shopping", "Bills", "Health", "Other"].map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setEditCategory(cat)}
                                                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${editCategory === cat
                                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Note (Optional)</label>
                                            <input
                                                type="text"
                                                value={editNote}
                                                onChange={(e) => setEditNote(e.target.value)}
                                                className="w-full bg-muted border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                placeholder="What was this for?"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                onClick={handleUpdate}
                                                disabled={!editAmount || updating}
                                                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                                            >
                                                {updating ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
