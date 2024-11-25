import { PlusIcon } from "lucide-react";

import { Button } from "@/ui-components/button-shiny";
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalDescription, ResponsiveModalTitle, ResponsiveModalTrigger } from "@/ui-components/modal";

import { GoalRecommendationsCard } from "./GoalRecommendationsCard";
import { GoalSettingsCard } from "./GoalSettingsCard";

export function GoalCreationButton({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ResponsiveModal>
      <ResponsiveModalTrigger asChild>
        <Button variant="expandIcon" Icon={PlusIcon} iconPlacement="right" className={className}>
          New Goal
        </Button>
      </ResponsiveModalTrigger>
      <ResponsiveModalContent>
        <ResponsiveModalTitle className="sr-only">Set Your Goal</ResponsiveModalTitle>
        <ResponsiveModalDescription className="sr-only">This modal allows you to set a new goal and view new goal recommendations.</ResponsiveModalDescription>
        <GoalSettingsCard showTitle />
        <GoalRecommendationsCard />
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}

export default GoalCreationButton;