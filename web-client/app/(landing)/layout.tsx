import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { LenisProvider } from "@/components/landing/lenis-provider"

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
})

export const metadata: Metadata = {
    title: "CoinTrack - Smart Expense Tracking",
    description: "The AI-powered expense tracker that automatically categorizes spending, predicts budgets, and helps you save money effortlessly.",
}

export default function LandingLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="dark">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Cal+Sans&family=Instrument+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className={`${manrope.variable} font-sans antialiased bg-zinc-950 text-zinc-100`}>
                <LenisProvider>{children}</LenisProvider>
            </body>
        </html>
    )
}
