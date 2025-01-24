import type React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/ui-components/card"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Freelance Designer",
    content: "GoalTime has transformed my work-life balance. I'm more productive and less stressed!",
  },
  {
    name: "Michael Chen",
    role: "Startup Founder",
    content: "The AI-powered insights have helped me prioritize tasks and achieve my business goals faster.",
  },
]

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-white">Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-xs sm:backdrop-blur-sm text-white">
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
  )
}

export default TestimonialsSection

