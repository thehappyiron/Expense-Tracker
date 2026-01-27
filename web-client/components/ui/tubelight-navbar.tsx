"use client"

import React, { useEffect, useState, memo } from "react"
import { motion, LayoutGroup } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

interface NavItem {
    name: string
    url: string
    icon: LucideIcon
}

interface NavBarProps {
    items: NavItem[]
    className?: string
}

// Memoized nav link for zero re-renders
const NavLink = memo(function NavLink({
    item,
    isActive,
    isMobile
}: {
    item: NavItem;
    isActive: boolean;
    isMobile: boolean;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.url}
            className={cn(
                "relative cursor-pointer text-base font-semibold px-8 py-3 rounded-full transition-colors duration-150",
                "text-foreground/80 dark:text-muted-foreground hover:text-primary transition-colors",
                isActive && "bg-muted text-primary",
            )}
        >
            <span className="hidden md:inline">{item.name}</span>
            <span className="md:hidden">
                <Icon size={22} strokeWidth={2.5} />
            </span>
            {isActive && (
                <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                    }}
                >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                        <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                        <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                        <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                </motion.div>
            )}
        </Link>
    );
});

import { ThemeToggle } from "@/components/theme-toggle"

function NavBarComponent({ items, className }: NavBarProps) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);
    const { signOut } = useAuth();

    // Debounced resize handler
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
            }, 100);
        };

        // Initial check without debounce
        setIsMobile(window.innerWidth < 768);

        window.addEventListener("resize", handleResize, { passive: true });
        return () => {
            window.removeEventListener("resize", handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div
            className={cn(
                "fixed bottom-0 sm:top-0 sm:bottom-auto left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
                className,
            )}
        >
            <div className="flex items-center gap-4 bg-background/5 dark:bg-background/10 border border-border/40 dark:border-white/20 backdrop-blur-lg dark:backdrop-blur-3xl py-2 px-3 rounded-full shadow-lg dark:shadow-2xl transition-all relative overflow-hidden">
                {/* Sharper top reflection for glass effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                <LayoutGroup>
                    {items.map((item) => (
                        <NavLink
                            key={item.name}
                            item={item}
                            isActive={pathname === item.url}
                            isMobile={isMobile}
                        />
                    ))}
                </LayoutGroup>

                <div className="h-6 w-px bg-border/50 mx-1 hidden md:block" />

                <div className="flex items-center gap-1">
                    <ThemeToggle />

                    {/* Logout Button */}
                    <button
                        onClick={signOut}
                        className={cn(
                            "relative cursor-pointer text-base font-semibold px-4 py-3 rounded-full transition-colors duration-150",
                            "text-foreground/60 dark:text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                        )}
                        title="Logout"
                    >
                        <span className="hidden md:inline">Logout</span>
                        <span className="md:hidden">
                            <LogOut size={22} strokeWidth={2.5} />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export const NavBar = memo(NavBarComponent);

