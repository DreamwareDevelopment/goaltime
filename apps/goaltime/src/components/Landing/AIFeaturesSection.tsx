import type React from "react"
import { Pencil, Smile } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/ui-components/card"
import { ChatBubbleIcon } from "@radix-ui/react-icons"

const features = [
  { title: "Rescheduling", description: "Something off calendar come up? Tell your agent about it and it will reschedule your day for you.", icon: Pencil },
  { title: "Goal Advice", description: "Need advice on how to achieve your goals? Just ask your agent and get personalized advice.", icon: ChatBubbleIcon },
  { title: "Highly Personalized", description: "We use your conversations with your agent as context to better schedule your goals.", icon: Smile },
]

const AIFeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-4">Accountability Agent Features</h2>
        <p className="text-sm text-center mb-12">*These features are only available in the Ambitious plan and above.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/10 text-white">
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
  )
}

export default AIFeaturesSection
