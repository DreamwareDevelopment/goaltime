'use client';

import { cn } from "@/libs/ui-components/src/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/libs/ui-components/src/components/ui/card"
import { Toggle } from "@/libs/ui-components/src/components/ui/toggle"
import { Bell, MessageSquare, Phone } from "lucide-react"

export interface Schedule {
  id: number;
  name: string;
  time: string;
  callEnabled: boolean;
  messageEnabled: boolean;
  pushEnabled: boolean;
}


export interface GoalScheduleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  schedule: Schedule[]
}

export function GoalScheduleCard({ schedule, className }: GoalScheduleCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Today&apos;s Schedule</CardTitle>
        <CardDescription>Your protected time blocks</CardDescription>
      </CardHeader>
      <CardContent>
        {schedule.map((item) => (
          <div key={item.id} className="flex justify-between items-center mb-4">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.time}</p>
            </div>
            <div>
              <Toggle
                aria-label={`Toggle call for ${item.name}`}
                pressed={item.callEnabled}
                onPressedChange={() => {}}
                className="mr-2"
              >
                <Phone className="h-4 w-4" />
              </Toggle>
              <Toggle
                aria-label={`Toggle message for ${item.name}`}
                pressed={item.messageEnabled}
                onPressedChange={() => {}}
                className="mr-2"
              >
                <MessageSquare className="h-4 w-4" />
              </Toggle>
              <Toggle
                aria-label={`Toggle push notifications for ${item.name}`}
                pressed={item.pushEnabled}
                onPressedChange={() => {}}
              >
                <Bell className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}