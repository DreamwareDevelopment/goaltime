import { ArrowRight, CheckCircle, Clock, Target, Calendar, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui-components/card"

import { MobileMenu } from '../components/Landing/MobileMenu'
import { cookies } from 'next/headers'
import { SUPABASE_COOKIE_NAME } from '@/server-utils/supabase'
import { MailingListForm } from '../components/Landing/MailingListForm'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const isLoggedIn = Boolean(SUPABASE_COOKIE_NAME && cookieStore.get(SUPABASE_COOKIE_NAME)?.value)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <Clock className="h-6 w-6 mr-2" />
          <span className="font-bold">GoalTime</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <ShinyButton variant="linkHover2" className="hidden md:flex bg-background hover:bg-background/80 text-background-foreground" asChild>
            <a href="#features">Features</a>
          </ShinyButton>
          <ShinyButton variant="linkHover2" className="hidden md:flex bg-background hover:bg-background/80 text-background-foreground" asChild>
            <a href="#testimonials">Testimonials</a>
          </ShinyButton>
          <ShinyButton variant="linkHover2" className="hidden md:flex bg-background hover:bg-background/80 text-background-foreground" asChild>
            <a href="#pricing">Pricing</a>
          </ShinyButton>
          <ShinyButton variant="expandIcon" Icon={ArrowRight} iconPlacement="right" asChild className="hidden md:flex md:min-w-[178px]">
            <Link href={isLoggedIn ? '/dashboard' : '/login?type=signup'}>Set Goals</Link>
          </ShinyButton>
          <MobileMenu isLoggedIn={isLoggedIn} />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col justify-center items-center gap-6 text-center">
              <div className="flex flex-col justify-center gap-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Achieve Your Goals with GoalTime
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Manage your time effectively, set meaningful goals, and track your progress with our intuitive AI-powered platform.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <ShinyButton variant="expandIcon" Icon={ArrowRight} iconPlacement="right" asChild>
                  <Link href={isLoggedIn ? '/dashboard' : '/login?type=signup'}>Start Free Trial</Link>
                </ShinyButton>
                <ShinyButton variant="expandIcon" Icon={Play} iconPlacement="right" asChild className="bg-accent hover:bg-accent/80 text-accent-foreground h-[63px]">
                  <Link href="/demo">Watch Demo</Link>
                </ShinyButton>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Smart Goal Setting", description: "Set SMART goals with AI assistance", icon: Target },
                { title: "Time Blocking", description: "Efficiently manage your time with our intuitive calendar", icon: Calendar },
                { title: "Progress Tracking", description: "Visual insights into your goal progress", icon: Chart }
              ].map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <feature.icon className="w-8 h-8 mb-2" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Testimonials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: "Sarah Johnson", role: "Freelance Designer", content: "GoalTime has transformed my work-life balance. I'm more productive and less stressed!" },
                { name: "Michael Chen", role: "Startup Founder", content: "The AI-powered insights have helped me prioritize tasks and achieve my business goals faster." }
              ].map((testimonial, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{testimonial.name}</CardTitle>
                    <CardDescription>{testimonial.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 dark:text-gray-400">&quot;{testimonial.content}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Basic", price: "$9.99/month", features: ["Unlimited goal setting", "Basic time blocking", "Weekly progress reports"] },
                { name: "Pro", price: "$19.99/month", features: ["All Basic features", "AI-powered insights", "Advanced analytics", "Priority support"] },
                { name: "Team", price: "$49.99/month", features: ["All Pro features", "Team collaboration tools", "Custom integrations", "Dedicated account manager"] }
              ].map((plan, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold">{plan.price}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardContent>
                    <ShinyButton variant="expandIcon" Icon={Plus} iconPlacement="right" className="w-full">Choose Plan</ShinyButton>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-6 mb-1">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to achieve your goals?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Join thousands of successful goal-setters and take control of your time today.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-4">
                <MailingListForm />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By signing up, you agree to our <a href="#" className="underline underline-offset-2">Terms & Conditions</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2023 GoalTime. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </a>
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Privacy Policy
          </a>
        </nav>
      </footer>
    </div>
  )
}

function Chart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}