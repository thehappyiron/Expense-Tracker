"use client";

import { useState, memo, useCallback } from "react";
import { Plus, X, DollarSign, Tag, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

// Smooth but fast animation variants
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
};

const fabVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
};

function QuickAddExpenseComponent() {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const { user } = useAuth();

    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleOpen = useCallback(() => {
        setOpen(true);
        setStatus('idle');
    }, []);

    const handleClose = useCallback(() => {
        if (isSaving) return; // Prevent closing while saving
        setOpen(false);
        setStatus('idle');
    }, [isSaving]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setStatus('error');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) return;

        setIsSaving(true);
        setStatus('idle');

        const expenseData = {
            amount: amountNum,
            category: category || "Uncategorized",
            note: note,
            date: Timestamp.now(),
            createdAt: Timestamp.now(),
        };

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timed out. Check your internet.")), 10000)
        );

        try {
            await Promise.race([
                addDoc(collection(db, "users", user.uid, "expenses"), expenseData),
                timeoutPromise
            ]);

            console.log("✅ Expense saved to Firestore");

            setAmount("");
            setCategory("");
            setNote("");
            setStatus('success');

            // Close modal after showing success
            setTimeout(() => {
                setOpen(false);
                setStatus('idle');
            }, 800);

        } catch (error: any) {
            console.error("❌ Quick Add Error:", error);
            setStatus('error');
            alert(error.message || "Failed to save. Try refreshing.");
        } finally {
            setIsSaving(false);
        }

    }, [user, amount, category, note]);


    return (
        <>
            {/* FAB Button */}
            <motion.button
                variants={fabVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handleOpen}
                className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-xl shadow-blue-500/40 flex items-center justify-center z-50"
            >
                <Plus className="w-6 h-6 text-white" />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            variants={overlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ duration: 0.15 }}
                            onClick={handleClose}
                            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            className="fixed bottom-24 right-8 w-80 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-border rounded-3xl shadow-2xl z-50 p-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Quick Add Expense</h3>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleClose}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Success State */}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center py-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    >
                                        <CheckCircle className="w-14 h-14 text-emerald-500 mb-2" />
                                    </motion.div>
                                    <p className="text-emerald-600 font-medium">Added!</p>
                                </motion.div>
                            )}

                            {/* Error State */}
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl"
                                >
                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                    <p className="text-rose-600 text-sm">Please sign in first</p>
                                </motion.div>
                            )}

                            {/* Form */}
                            {status === 'idle' && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Amount"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pl-10 bg-white/60 border-slate-200 focus:ring-blue-500/30 rounded-xl"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Category (e.g. Food)"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="pl-10 bg-white/60 border-slate-200 focus:ring-blue-500/30 rounded-xl"
                                        />
                                    </div>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Note (optional)"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="pl-10 bg-white/60 border-slate-200 focus:ring-blue-500/30 rounded-xl"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={!amount || isSaving}
                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50"
                                    >
                                        {isSaving ? "Adding..." : "Add Expense"}
                                    </Button>
                                </form>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export const QuickAddExpense = memo(QuickAddExpenseComponent);
