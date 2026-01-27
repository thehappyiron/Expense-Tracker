"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { analyzeOccupation } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ArrowRight, Loader2, Sparkles, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [occupation, setOccupation] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"input" | "analyzing" | "complete">("input");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !occupation.trim()) return;

        setLoading(true);
        setStep("analyzing");

        try {
            const analysis = await analyzeOccupation(occupation);

            await updateDoc(doc(db, "users", user.uid), {
                occupation: {
                    title: occupation,
                    analysis: analysis,
                },
                categories: analysis.categories || [],
                onboardingComplete: true,
            });

            setStep("complete");
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error) {
            console.error("Onboarding error:", error);
            await updateDoc(doc(db, "users", user.uid), {
                occupation: { title: occupation },
                onboardingComplete: true,
            });
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Blobs */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-violet-200/50 to-purple-200/50 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-cyan-200/40 to-teal-200/40 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 shadow-2xl shadow-blue-500/10">
                    <AnimatePresence mode="wait">
                        {step === "input" && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <Briefcase className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <div className="text-center mb-8">
                                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Let's Personalize CoinTrack</h1>
                                    <p className="text-slate-500 text-sm">Tell us your occupation so we can tailor your experience</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <Input
                                            value={occupation}
                                            onChange={(e) => setOccupation(e.target.value)}
                                            placeholder="e.g. Software Engineer, Doctor, Student"
                                            className="pl-12 py-6 text-base bg-white/60 border-slate-200 rounded-2xl focus:ring-blue-500/30"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || !occupation.trim()}
                                        className="w-full py-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
                                    >
                                        <span>Continue</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {step === "analyzing" && (
                            <motion.div
                                key="analyzing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-8"
                            >
                                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Analyzing Your Profile</h2>
                                <p className="text-slate-500 text-sm">Our AI is creating personalized categories for you...</p>
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mt-6" />
                            </motion.div>
                        )}

                        {step === "complete" && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">You're All Set!</h2>
                                <p className="text-slate-500 text-sm">Redirecting to your dashboard...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
