import type React from "react"
import { CheckCircle, Plus } from "lucide-react"
import { Button as ButtonShiny } from "@/ui-components/button-shiny"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/ui-components/card"

const pricingPlans = [
  {
    name: "Committed",
    price: "$15.99/month",
    features: ["Unlimited goal setting", "Automatic time blocking", "AI progress tracking"],
  },
  {
    name: "Ambitious",
    price: "$35.99/month",
    features: [`All Committed features`, "AI Accountability Coach", "AI Rescheduling", "Priority support"],
  },
  {
    name: "Superhuman",
    price: "$69.99/month",
    features: [`All Ambitious Features`, "Shared Goals", "Custom Analytics", "External AI Agents"],
    comingSoon: true,
  },
]

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-2">Pricing</h2>
        <p className="text-lg text-center mb-12">(7 day free trial)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className="flex flex-col bg-white/10 backdrop-blur-xs sm:backdrop-blur-sm text-white">
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
                <ButtonShiny variant="shine" className="w-full" disabled={plan.comingSoon}>
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
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection

