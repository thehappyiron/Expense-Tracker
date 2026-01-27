"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { LiquidMetalBorder } from "@/components/landing/liquid-metal-border"
import { cn } from "@/lib/utils"

interface LiquidCtaButtonProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    href?: string
    theme?: "light" | "dark"
}

export function LiquidCtaButton({ children, className, onClick, href, theme = "dark" }: LiquidCtaButtonProps) {
    const router = useRouter()
    const isLight = theme === "light"

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else if (href) {
            router.push(href)
        }
    }

    return (
        <button
            onClick={handleClick}
            className={cn("group transition-transform duration-300 hover:scale-105 active:scale-95", className)}
        >
            <div className={cn("rounded-full", isLight && "shadow-[0_8px_20px_rgba(0,0,0,0.25)]")}>
                <LiquidMetalBorder borderRadius={9999} borderWidth={2} theme={theme} opacity={1} speed={1.2} scale={3}>
                    <div
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-full",
                            isLight
                                ? "bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300"
                                : "bg-gradient-to-b from-zinc-800 to-zinc-900",
                        )}
                    >
                        <span className={cn("text-sm font-medium transition-colors", isLight ? "text-zinc-600" : "text-zinc-200")}>
                            {children}
                        </span>
                        <ArrowRight
                            className={cn(
                                "w-5 h-5 group-hover:translate-x-1 transition-all duration-300",
                                isLight ? "text-zinc-600" : "text-zinc-200",
                            )}
                        />
                    </div>
                </LiquidMetalBorder>
            </div>
        </button>
    )
}
