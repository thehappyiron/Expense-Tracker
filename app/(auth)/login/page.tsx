"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Mail, X, ChevronDown } from "lucide-react";

// Realistic Glass Button Component
const GlassButton = ({
    children,
    onClick,
    disabled,
    variant = "secondary",
    className = "",
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary";
    className?: string;
}) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-50, 50], [5, -5]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(x, [-50, 50], [-5, 5]), { stiffness: 300, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const isPrimary = variant === "primary";

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformPerspective: 1000,
            }}
            whileHover={{ scale: 1.03, z: 30 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`relative overflow-hidden group disabled:opacity-50 ${className}`}
        >
            {/* Base glass layer - INTENSIFIES on hover */}
            <div
                className="absolute inset-0 rounded-2xl transition-all duration-200"
                style={{
                    background: isPrimary
                        ? "linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(109,40,217,0.9) 50%, rgba(91,33,182,0.95) 100%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 100%)",
                    backdropFilter: "blur(20px) saturate(150%)",
                    WebkitBackdropFilter: "blur(20px) saturate(150%)",
                }}
            />

            {/* iOS 26 Liquid Glass - subtle blur increase, NO white overlay */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{
                    background: "transparent",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                }}
            />

            {/* Glass thickness - STRONGER inner glow on hover */}
            <div
                className="absolute inset-0 rounded-2xl transition-all duration-150"
                style={{
                    boxShadow: isPrimary
                        ? "inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.2)"
                        : "inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.1)",
                }}
            />
            {/* Subtle inner glow on hover - not bright */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{
                    boxShadow: isPrimary
                        ? "inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -1px 3px rgba(0,0,0,0.1)"
                        : "inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.05)",
                }}
            />

            {/* Subtle top edge highlight */}
            <div
                className="absolute top-0 left-[20%] right-[20%] h-[1px] rounded-t-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 50%, transparent)",
                }}
            />

            {/* Bottom edge shadow - glass depth */}
            <div
                className="absolute bottom-0 left-[5%] right-[5%] h-[1px] opacity-50 group-hover:opacity-80 transition-opacity duration-150"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.4) 70%, transparent)",
                }}
            />

            {/* Side edge highlights - BRIGHTER on hover */}
            <div className="absolute top-[5%] bottom-[5%] left-0 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent group-hover:via-white/60 transition-all duration-150" />
            <div className="absolute top-[5%] bottom-[5%] right-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent group-hover:via-white/50 transition-all duration-150" />

            {/* Very subtle light refraction at top */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: "radial-gradient(ellipse 100% 30% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)",
                }}
            />

            {/* Subtle light sweep - very gentle */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                    style={{
                        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 52%, transparent 60%)",
                    }}
                />
            </div>

            {/* Subtle outer glow on hover */}
            <div
                className="absolute inset-[-1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                style={{
                    boxShadow: isPrimary
                        ? "0 0 25px rgba(124,58,237,0.3), 0 10px 25px -10px rgba(124,58,237,0.25)"
                        : "0 0 15px rgba(255,255,255,0.04), 0 8px 20px -8px rgba(0,0,0,0.1)",
                }}
            />

            {/* Border - slightly more visible on hover */}
            <div
                className="absolute inset-0 rounded-2xl border border-white/[0.08] group-hover:border-white/[0.15] transition-all duration-300"
            />

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center">
                {children}
            </div>
        </motion.button>
    );
};

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"signup" | "signin">("signup");
    const [firstName, setFirstName] = useState("John");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("(775) 351-6501");

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError("");
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        createdAt: serverTimestamp(),
                        onboardingComplete: false,
                    });
                    router.push("/onboarding");
                } else {
                    const userData = userSnap.data();
                    if (!userData.onboardingComplete) {
                        router.push("/onboarding");
                    } else {
                        router.push("/dashboard");
                    }
                }
            } catch (firestoreError: any) {
                console.warn("Firestore unavailable, proceeding to dashboard:", firestoreError);
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error("Sign-in error:", err);
            const errorMessage = err.code
                ? `Error (${err.code}): ${err.message}`
                : err.message || "Failed to sign in. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">

            {/* Purple/Blue Gradient at Bottom - Large */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[80%] pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 130% 80% at 50% 100%, rgba(147, 51, 234, 0.5) 0%, rgba(139, 92, 246, 0.35) 30%, rgba(88, 28, 135, 0.15) 55%, transparent 80%)",
                }}
            />

            {/* Intense purple glow - center bottom */}
            <div
                className="absolute bottom-[-25%] left-1/2 -translate-x-1/2 w-[160%] h-[70%] pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.45) 0%, rgba(139, 92, 246, 0.3) 25%, rgba(88, 28, 135, 0.1) 50%, transparent 70%)",
                    filter: "blur(50px)",
                }}
            />

            {/* Purple glow - right side accent */}
            <div
                className="absolute bottom-[5%] right-[-5%] w-[45%] h-[55%] pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(192, 132, 252, 0.35) 0%, rgba(147, 51, 234, 0.2) 40%, transparent 70%)",
                    filter: "blur(40px)",
                }}
            />

            {/* Login Modal - iOS 26 Liquid Glass with transparent bottom */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[460px] rounded-3xl p-8 overflow-hidden"
                style={{
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
                }}
            >
                {/* Glass background - gradient from solid top to transparent bottom */}
                <div
                    className="absolute inset-0 rounded-3xl"
                    style={{
                        background: "linear-gradient(180deg, rgba(25, 25, 35, 0.9) 0%, rgba(25, 25, 35, 0.75) 40%, rgba(25, 25, 35, 0.5) 70%, rgba(25, 25, 35, 0.3) 100%)",
                    }}
                />

                {/* Subtle top edge highlight */}
                <div
                    className="absolute top-0 left-[10%] right-[10%] h-[1px]"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 50%, transparent)",
                    }}
                />

                {/* Content wrapper */}
                <div className="relative z-10">
                    {/* Close Button */}
                    <button
                        onClick={() => router.push("/")}
                        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all duration-300 hover:scale-110"
                    >
                        <X className="w-4 h-4 text-white/70" />
                    </button>

                    {/* Tab Toggle */}
                    <div className="flex justify-center mb-8">
                        <div
                            className="inline-flex rounded-full p-1 border border-white/[0.08]"
                            style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            <button
                                onClick={() => setActiveTab("signup")}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "signup"
                                    ? "bg-white text-[#0a0a0f] shadow-lg"
                                    : "text-white/50 hover:text-white/70"
                                    }`}
                            >
                                Sign up
                            </button>
                            <button
                                onClick={() => setActiveTab("signin")}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "signin"
                                    ? "bg-white text-[#0a0a0f] shadow-lg"
                                    : "text-white/50 hover:text-white/70"
                                    }`}
                            >
                                Sign in
                            </button>
                        </div>
                    </div>

                    {/* Header */}
                    <h1 className="text-[22px] font-semibold text-white mb-6">
                        {activeTab === "signup" ? "Create an account" : "Welcome back"}
                    </h1>

                    {/* Name Fields - Side by Side */}
                    <div className="flex gap-3 mb-4">
                        <div
                            className="flex-1 rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-300 focus-within:border-white/20"
                            style={{ background: "rgba(255, 255, 255, 0.03)" }}
                        >
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                className="w-full py-4 px-4 bg-transparent text-white placeholder-white/30 focus:outline-none text-[15px]"
                            />
                        </div>
                        <div
                            className="flex-1 rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-300 focus-within:border-white/20"
                            style={{ background: "rgba(255, 255, 255, 0.03)" }}
                        >
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                className="w-full py-4 px-4 bg-transparent text-white/40 placeholder-white/30 focus:outline-none text-[15px]"
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div
                        className="flex items-center gap-3 rounded-xl border border-white/[0.08] px-4 mb-4 transition-all duration-300 focus-within:border-white/20"
                        style={{ background: "rgba(255, 255, 255, 0.03)" }}
                    >
                        <Mail className="w-5 h-5 text-white/30" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 py-4 bg-transparent text-white placeholder-white/30 focus:outline-none text-[15px]"
                        />
                    </div>

                    {/* Phone Input */}
                    <div
                        className="flex items-center rounded-xl border border-white/[0.08] mb-6 transition-all duration-300 focus-within:border-white/20"
                        style={{ background: "rgba(255, 255, 255, 0.03)" }}
                    >
                        <div className="flex items-center gap-2 px-4 py-4 border-r border-white/[0.08]">
                            <span className="text-base">🇺🇸</span>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone number"
                            className="flex-1 py-4 px-4 bg-transparent text-white/50 placeholder-white/30 focus:outline-none text-[15px]"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center mb-4"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Create Account Button - Ultra Realistic Glass */}
                    <GlassButton
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        variant="primary"
                        className="w-full py-4 rounded-2xl mb-6"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="text-white font-medium text-[15px] drop-shadow-sm">Create an account</span>
                        )}
                    </GlassButton>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/[0.08]" />
                        <span className="text-white/30 text-xs uppercase tracking-widest font-medium">or sign in with</span>
                        <div className="flex-1 h-px bg-white/[0.08]" />
                    </div>

                    {/* Social Login Buttons - Ultra Realistic Glass */}
                    <div className="flex gap-3 mb-6">
                        <GlassButton
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            variant="secondary"
                            className="flex-1 py-4 rounded-2xl"
                        >
                            <svg className="w-5 h-5 drop-shadow-sm" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </GlassButton>

                        <GlassButton
                            variant="secondary"
                            className="flex-1 py-4 rounded-2xl"
                        >
                            <svg className="w-5 h-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                        </GlassButton>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-white/30 text-sm">
                        By creating an account, you agree to our{" "}
                        <span className="text-white/50 hover:text-white/70 cursor-pointer transition-colors">
                            Terms & Service
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
