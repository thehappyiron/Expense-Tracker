"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { collection, query, orderBy, onSnapshot, Timestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    note?: string;
    date: Timestamp;
}

export default function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: `Hello! I'm CoinTrack AI. I have access to your real expense data. How can I help you with your finances today?` }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurring, setRecurring] = useState<any[]>([]);
    const [budgets, setBudgets] = useState<Record<string, number>>({});
    const [incomes, setIncomes] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch real costs & budgets
    useEffect(() => {
        if (!user) return;

        const firstName = user.displayName?.split(" ")[0] || "there";
        setMessages(prev => {
            if (prev.length === 1 && prev[0].role === "assistant") {
                return [{ role: "assistant", content: `Hello ${firstName}! I'm CoinTrack AI. I have access to your real expense data. How can I help you with your finances today?` }];
            }
            return prev;
        });

        // Fetch expenses
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

        // Fetch recurring
        const qRecs = query(collection(db, "users", user.uid, "recurring_expenses"));
        const unsubRecs = onSnapshot(qRecs, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecurring(data);
        });

        // Fetch budgets
        const unsubBudgets = onSnapshot(doc(db, "users", user.uid, "settings_data", "budgets"), (docSnap) => {
            if (docSnap.exists()) {
                setBudgets(docSnap.data() as Record<string, number>);
            }
        });

        // Fetch incomes
        const qIncomes = query(collection(db, "users", user.uid, "incomes"));
        const unsubIncomes = onSnapshot(qIncomes, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setIncomes(data);
        });

        return () => {
            unsubExpenses();
            unsubRecs();
            unsubBudgets();
            unsubIncomes();
        };
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            // Group by category
            const categoryTotals: Record<string, number> = {};
            expenses.forEach(exp => {
                const cat = exp.category || "Uncategorized";
                categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
            });

            // One-time expenses for CURRENT MONTH
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthlyOneTime = expenses.filter(exp => {
                const expDate = exp.date.toDate();
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            });
            const monthlyOneTimeTotal = monthlyOneTime.reduce((sum, exp) => sum + exp.amount, 0);

            // Recurring expenses totals
            const monthlyRecurringTotal = recurring.reduce((sum, item) => {
                if (item.frequency === "weekly") return sum + (item.amount * 4);
                if (item.frequency === "yearly") return sum + (item.amount / 12);
                return sum + item.amount;
            }, 0);

            // Build expense summary for AI
            const expenseData = {
                totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
                totalTransactions: expenses.length,
                thisMonthTotal: monthlyOneTimeTotal + monthlyRecurringTotal,
                thisMonthTransactions: monthlyOneTime.length,
                thisMonthOneTime: monthlyOneTimeTotal,
                monthlyRecurringCommitments: monthlyRecurringTotal,
                categoryBreakdown: categoryTotals,
                budgets: budgets,
                incomes: incomes.map(inc => `  - ${inc.year}-${inc.month + 1}: ₹${inc.amount}`).join("\n"),
                recurringList: recurring.map(r => `  - ${r.name}: ₹${r.amount} (${r.frequency})`).join("\n"),
                fullHistory: expenses.slice(0, 30).map(exp =>
                    `- ${exp.date.toDate().toLocaleDateString()}: ${exp.category} - ${exp.note ? '(' + exp.note + ') ' : ''}₹${exp.amount.toFixed(2)}`
                ).join("\n")
            };

            const context = {
                user: user?.displayName || "User",
                time: new Date().toLocaleString(),
                expenseData: expenseData  // Pass REAL data including full history
            };

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, context }),
            });

            const data = await res.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-white/80 dark:bg-card/80 backdrop-blur-sm border border-slate-200/60 dark:border-border rounded-3xl overflow-hidden shadow-lg relative transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-primary dark:to-primary/50 z-10" />

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex gap-4 max-w-[80%]",
                            msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg",
                            msg.role === "user"
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 dark:bg-none dark:bg-primary"
                                : "bg-gradient-to-br from-emerald-400 to-teal-500 dark:bg-none dark:bg-muted dark:shadow-primary/10"
                        )}>
                            {msg.role === "user" ? <UserIcon className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white dark:text-primary" />}
                        </div>

                        <div className={cn(
                            "p-4 rounded-2xl shadow-lg transition-colors border",
                            msg.role === "user"
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 dark:bg-none dark:bg-primary border-transparent text-white dark:text-primary-foreground rounded-tr-none"
                                : "bg-white/90 dark:bg-muted/80 backdrop-blur-lg border-slate-200/60 dark:border-border text-slate-700 dark:text-foreground rounded-tl-none"
                        )}>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium tracking-normal">{msg.content || "..."}</p>
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[80%]">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white/80 dark:bg-muted/80 backdrop-blur-lg border border-white/50 dark:border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 dark:bg-primary rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-blue-500 dark:bg-primary rounded-full animate-bounce delay-150" />
                            <div className="w-2 h-2 bg-blue-500 dark:bg-primary rounded-full animate-bounce delay-300" />
                        </div>
                    </motion.div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white/40 dark:bg-muted/20 backdrop-blur-lg border-t border-white/30 dark:border-border">
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask CoinTrack AI about your spending..."
                        className="bg-white/60 dark:bg-muted border-slate-200 dark:border-border text-slate-800 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground h-12 pr-12 rounded-xl focus:ring-blue-500/30 dark:focus:ring-primary/20 transition-all font-medium"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !input}
                        className="absolute right-1 top-1 h-10 w-10 p-0 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 dark:bg-none dark:bg-primary text-white dark:text-primary-foreground hover:opacity-90 shadow-lg shadow-blue-500/30 dark:shadow-primary/20 transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
