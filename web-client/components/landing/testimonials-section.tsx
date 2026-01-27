"use client"

import { motion } from "motion/react"
import { TestimonialsColumn } from "@/components/landing/testimonials-column"

const testimonials = [
    {
        text: "CoinTrack completely changed how I manage my money. I saved $500 in my first month just by seeing where my money was going.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
        name: "Sarah Chen",
        role: "Freelance Designer",
    },
    {
        text: "The AI categorization is incredibly accurate. It saves me hours of manual expense tracking every week.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        name: "Marcus Johnson",
        role: "Small Business Owner",
    },
    {
        text: "Finally, an expense tracker that actually helps me stick to my budget. The smart alerts are a game changer!",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        name: "Emily Rodriguez",
        role: "Marketing Manager",
    },
    {
        text: "Connected all my bank accounts in minutes. Now I can see my complete financial picture in one place.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        name: "David Park",
        role: "Software Engineer",
    },
    {
        text: "The budget insights helped me identify subscriptions I forgot about. Canceled 5 services I wasn't using!",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
        name: "Aisha Patel",
        role: "Product Manager",
    },
    {
        text: "Best investment I made for my personal finances. The ROI was immediate - found $200 in monthly savings.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        name: "James Wilson",
        role: "Entrepreneur",
    },
    {
        text: "Love how it predicts my upcoming expenses. No more surprises at the end of the month!",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
        name: "Lisa Thompson",
        role: "Consultant",
    },
    {
        text: "The visual reports make it so easy to understand my spending patterns. Highly recommend!",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
        name: "Michael Brown",
        role: "Financial Analyst",
    },
    {
        text: "My family finally has a shared view of our household expenses. It's made budgeting together so much easier.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
        name: "Rachel Kim",
        role: "Working Parent",
    },
]

const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

const logos = ["Stripe", "Plaid", "Visa", "Mastercard", "Chase", "Amex"]

export function TestimonialsSection() {
    return (
        <section id="testimonials" className="px-6 py-24 bg-zinc-900/30">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-xl mx-auto mb-12"
                >
                    <div className="border border-zinc-800 py-1.5 px-4 rounded-full text-sm text-zinc-400">Testimonials</div>

                    <h2 className="font-display text-4xl md:text-5xl font-bold text-zinc-100 mt-6 text-center tracking-tight">
                        Loved by savers everywhere
                    </h2>
                    <p className="text-center mt-4 text-zinc-500 text-lg text-balance">
                        See what our users have to say about CoinTrack.
                    </p>
                </motion.div>

                <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>

                <div className="mt-16 pt-16 border-t border-zinc-800/50">
                    <p className="text-center text-sm text-zinc-500 mb-8">Trusted integrations</p>
                    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                        <motion.div
                            className="flex gap-12 md:gap-16"
                            animate={{
                                x: ["0%", "-50%"],
                            }}
                            transition={{
                                x: {
                                    duration: 20,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "linear",
                                },
                            }}
                        >
                            {/* Duplicate logos for seamless loop */}
                            {[...logos, ...logos].map((logo, index) => (
                                <span
                                    key={`${logo}-${index}`}
                                    className="text-xl font-semibold text-zinc-700 whitespace-nowrap flex-shrink-0"
                                >
                                    {logo}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}
