import type React from "react"
import { CheckCircle, Plus } from "lucide-react"
import { Button } from "@/ui-components/button-shiny"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/ui-components/card"

const pricingPlans = [
  {
    name: "Basic",
    price: "$9.99/month",
    features: ["Unlimited goal setting", "Basic time blocking", "Weekly progress reports"],
  },
  {
    name: "Pro",
    price: "$19.99/month",
    features: ["All Basic features", "AI-powered insights", "Advanced analytics", "Priority support"],
  },
  {
    name: "Team",
    price: "$49.99/month",
    features: ["All Pro features", "Team collaboration tools", "Custom integrations", "Dedicated account manager"],
  },
]

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-black/30 backdrop-blur-xs sm:backdrop-blur-sm">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Pricing</h2>
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
                <Button className="w-full">
                  Choose Plan <Plus className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection

