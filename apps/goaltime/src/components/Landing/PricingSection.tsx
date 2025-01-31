'use client'

import type React from "react"
import { CheckCircle, Plus } from "lucide-react"
import { Button as ButtonShiny } from "@/ui-components/button-shiny"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/ui-components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui-components/tabs"
import { usePostHog } from 'posthog-js/react'
import { monthlyPricingPlans, PricingPlan, yearlyPricingPlans } from "@/shared/utils"

const PricingCard: React.FC<{plan: PricingPlan, yearly: boolean, userEmail?: string}> = ({plan, yearly, userEmail}) => {
  const posthog = usePostHog()
  const handleChoosePlanClick = () => {
    posthog?.capture('choose plan clicked', {
      plan: plan.name,
      userEmail
    })
    const url = userEmail
      ? `${plan.link}?prefilled_email=${encodeURIComponent(userEmail)}`
      : '/login'
    window.open(url, '_blank')
  }

  return (
    <Card className="flex flex-col bg-white/10 text-white h-full min-w-[300px]">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription className="text-2xl font-bold">{plan.price}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardContent>
        <ButtonShiny variant="shine" className="w-full" disabled={plan.comingSoon} onClick={handleChoosePlanClick}>
          {plan.comingSoon ? (
            <>
              <span>Coming Soon</span>
            </>
          ) : (
            <>
              <span>Choose Plan</span>
              <Plus className="ml-2 h-4 w-4" />
            </>
          )}
        </ButtonShiny>
      </CardContent>
    </Card>
  )
}

const PricingSection: React.FC<{userEmail?: string}> = ({userEmail}) => {
  return (
    <section id="pricing" className="w-full py-12">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-2">Pricing</h2>
        <p className="text-lg text-center mb-12">(14 day free trial)</p>
        <Tabs defaultValue="monthly" className="w-full flex flex-col items-center">
          <TabsList className="bg-white/10">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {monthlyPricingPlans.map((plan, index) => (
              <PricingCard plan={plan} yearly={false} userEmail={userEmail} key={`monthly-${index}`} />
            ))}
          </TabsContent>
          <TabsContent value="annual" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-0">
            {yearlyPricingPlans.map((plan, index) => (
              <PricingCard plan={plan} yearly={true} userEmail={userEmail} key={`yearly-${index}`} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

export default PricingSection

