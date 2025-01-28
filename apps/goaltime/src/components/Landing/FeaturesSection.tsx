import type React from "react"
import { Target, Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/ui-components/card"

const features = [
  { title: "Smart Goal Setting", description: "Hit your prioritized commitments and deadlines everytime, without the planning overhead.", icon: Target },
  { title: "Adaptive Time Blocking", description: "The schedule for people who hate scheduling. We manage your time for you and adapt to your changing calendar and preferences.", icon: Calendar },
  { title: "Progress Tracking", description: "Visual insights into your goal progress. Smart notifications when you're falling behind.", icon: Chart },
]

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Features</h2>
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

export default FeaturesSection

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