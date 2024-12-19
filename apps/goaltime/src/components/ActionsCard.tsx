"use client"

import { Target, Settings, ArrowUpRightIcon, NotebookIcon } from "lucide-react"
import { ChatBubbleIcon, StarFilledIcon } from "@radix-ui/react-icons"

import { CardHeader, CardTitle, CardContent } from "@/ui-components/card"
import { Button as ShinyButton } from "@/ui-components/button-shiny"

export function ActionsCard() {
  return (
    <>
      <CardHeader className="pt-6">
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ShinyButton variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full">
            <ChatBubbleIcon className="mr-2 h-4 w-4" /> Chat
          </ShinyButton>
          <ShinyButton variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full">
            <Target className="mr-2 h-4 w-4" /> Recommendations
          </ShinyButton>
          <ShinyButton variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full">
            <NotebookIcon className="mr-2 h-4 w-4" /> Notes
          </ShinyButton>
          <ShinyButton variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full">
            <StarFilledIcon className="mr-2 h-4 w-4" /> Feedback
          </ShinyButton>
          <ShinyButton variant="expandIcon" Icon={ArrowUpRightIcon} iconPlacement="right" className="w-full">
            <Settings className="mr-2 h-4 w-4" /> Preferences
          </ShinyButton>
        </div>
      </CardContent>
    </>
  )
}