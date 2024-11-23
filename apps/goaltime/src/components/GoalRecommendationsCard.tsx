import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card'
import { Button } from '@/ui-components/button'
import { Badge } from '@/ui-components/badge'
import { Lightbulb, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Priority } from './GoalSetupCard'

export interface GoalRecommendation {
  title: string;
  description: string;
  commitment: number;
  priority: Priority;
}

const recommendations: GoalRecommendation[] = [
  { title: "Learn a New Language", description: "Personal Development", commitment: 5, priority: 'Medium' },
  { title: "Exercise Regularly", description: "Health", commitment: 3, priority: 'High' },
  { title: "Read Books", description: "Education", commitment: 2, priority: 'Low' },
  { title: "Practice Meditation", description: "Wellness", commitment: 2, priority: 'Medium' },
  { title: "Work on Side Project", description: "Career", commitment: 4, priority: 'High' },
]

export function GoalRecommendationsCard({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => setExpanded(!expanded)

  const displayedRecommendations = expanded ? recommendations : recommendations.slice(0, 1)

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          Goal Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedRecommendations.map((goal, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <div className="text-sm text-muted-foreground">
                    {goal.description} • {goal.commitment} hours/week
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={goal.priority === 'High' ? 'destructive' : goal.priority === 'Medium' ? 'default' : 'secondary'}>
                    {goal.priority}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add goal</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {recommendations.length > 1 && (
          <Button
            variant="link"
            onClick={toggleExpanded}
            className="mt-4 w-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                View less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                View more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
