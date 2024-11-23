'use client';

import { Target, Settings, ArrowUpRightIcon, NotebookIcon } from "lucide-react"

import { cn } from "@/libs/ui-components/src/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/ui-components/card"
import { Button } from "@/ui-components/button-shiny"
import { ChatBubbleIcon, StarFilledIcon } from "@radix-ui/react-icons";

export function ActionsCard({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="py-5">
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full"><ChatBubbleIcon className="mr-2 h-4 w-4" /> Chat</Button>
          <Button variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full"><Target className="mr-2 h-4 w-4" /> Recommendations</Button>
          <Button variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full"><NotebookIcon className="mr-2 h-4 w-4" /> Notes</Button>
          <Button variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full"><StarFilledIcon className="mr-2 h-4 w-4" /> Feedback</Button>
          <Button variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full"><Settings className="mr-2 h-4 w-4" /> Preferences</Button>
        </div>
      </CardContent>
    </Card>
  )
}