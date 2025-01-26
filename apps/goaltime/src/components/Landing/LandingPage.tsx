import type React from "react"
import Header from "./Header"
import MountainBackground from "./MountainBackground"
import HeroSection from "./HeroSection"
import FeaturesSection from "./FeaturesSection"
import TestimonialsSection from "./TestimonialsSection"
import PricingSection from "./PricingSection"
import CtaSection from "./CtaSection"
import Footer from "./Footer"
import { createClient } from "@/server-utils/supabase"
import AIFeaturesSection from "./AIFeaturesSection"

const LandingPage: React.FC = async () => {
  const supabase = await createClient()
  const session = await supabase.auth.getSession()
  const isLoggedIn = !!session.data.session
  console.log(`isLoggedIn: ${isLoggedIn}`)
  return (
    <div className="min-h-screen flex flex-col relative">
      <MountainBackground />
      <Header isLoggedIn={isLoggedIn} />
      <main className="flex-1 relative z-10 bg-black/30 backdrop-blur-2xs sm:backdrop-blur-xs">
        <HeroSection isLoggedIn={isLoggedIn} />
        <FeaturesSection />
        <AIFeaturesSection />
        <TestimonialsSection />
        <PricingSection userEmail={session.data.session?.user.email} />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage