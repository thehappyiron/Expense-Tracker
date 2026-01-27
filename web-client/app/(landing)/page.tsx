import { HeroNavbar } from "@/components/landing/hero-navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { ImpactSection } from "@/components/landing/impact-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CtaSection } from "@/components/landing/cta-section"
import { FooterSection } from "@/components/landing/footer-section"

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-zinc-950">
            <HeroNavbar />
            <HeroSection />
            <ImpactSection />
            <FeaturesSection />
            <TestimonialsSection />
            <PricingSection />
            <CtaSection />
            <FooterSection />
        </main>
    )
}
