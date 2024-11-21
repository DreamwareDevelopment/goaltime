'use client';

import { Clock, Target, Settings } from "lucide-react"

import { cn } from "@/libs/ui-components/src/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/libs/ui-components/src/components/ui/card"
import { Button } from "@/libs/ui-components/src/components/ui/button"

export interface QuickActionsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  void?: never;
}

export function QuickActionsCard({ className }: QuickActionsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button className="w-full"><Clock className="mr-2 h-4 w-4" /> Reschedule</Button>
          <Button className="w-full"><Target className="mr-2 h-4 w-4" /> Adjust Goal</Button>
          <Button className="w-full"><Settings className="mr-2 h-4 w-4" /> Preferences</Button>
        </div>
      </CardContent>
    </Card>
  )
}