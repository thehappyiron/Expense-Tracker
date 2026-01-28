"use client"

import { motion } from "motion/react"
import { Brain, PieChart, Wallet, ArrowRight, CreditCard } from "lucide-react"

const integrationLogos = [
    { name: "Bank 1" },
    { name: "Bank 2" },
    { name: "Bank 3" },
    { name: "Bank 4" },
    { name: "Card 1" },
    { name: "Card 2" },
    { name: "Card 3" },
    { name: "Card 4" },
]

export function FeaturesSection() {
    return (
        <section id="features" className="px-6 py-24">
            <div className="max-w-5xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Features</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                        Everything you need to manage money
                    </h2>
                    <p className="text-zinc-500 max-w-xl mx-auto text-balance">
                        Essential tools to track your daily spending, set limits, and gain financial clarity.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1 - Budget Tracking */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="group h-full overflow-hidden border border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                                >
                                    <PieChart className="w-6 h-6 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                                </motion.div>
                                <p className="font-heading text-lg font-semibold text-zinc-100">Budget Goals</p>
                            </div>
                            <p className="text-zinc-500 mb-8">Set and track budgets across all categories to ensure you stay within your limits.</p>
                            <div className="mt-auto">
                                <div className="flex items-baseline gap-2 mb-3">
                                    <motion.span
                                        className="text-5xl font-display font-bold text-zinc-100"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                    >
                                        78%
                                    </motion.span>
                                    <span className="text-zinc-500 text-sm">of monthly budget</span>
                                </div>
                                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
                                        initial={{ width: "0%" }}
                                        whileInView={{ width: "78%" }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2 - Smart Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="group h-full overflow-hidden border border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center"
                                    whileHover={{ y: -2 }}
                                >
                                    <Wallet className="w-6 h-6 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                                </motion.div>
                                <p className="font-heading text-lg font-semibold text-zinc-100">Smart Alerts</p>
                            </div>
                            <p className="text-zinc-500 mb-8">Receive notifications when you are close to your spending limits for the day or month.</p>
                            <div className="flex justify-center gap-4 mt-auto">
                                {["🔔", "📊"].map((emoji, i) => (
                                    <motion.div
                                        key={emoji}
                                        className="flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 shadow-lg"
                                        initial={{ y: 0 }}
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 1.5,
                                            delay: i * 0.15,
                                            repeat: Number.POSITIVE_INFINITY,
                                            repeatDelay: 2,
                                        }}
                                        whileHover={{ scale: 1.1, y: -6 }}
                                    >
                                        <span className="text-3xl">{emoji}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
