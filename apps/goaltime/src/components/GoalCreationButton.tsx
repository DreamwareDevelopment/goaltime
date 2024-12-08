"use client"

import { PlusIcon } from "lucide-react";

import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalDescription, ResponsiveModalTitle, ResponsiveModalTrigger } from "@/ui-components/modal";

import { GoalRecommendation, GoalRecommendationsCard } from "./GoalRecommendationsCard";
import { GoalSettingsCard } from "./GoalSettingsCard";
import { GoalInput } from "@/libs/shared/src/lib/schemas/goals";
import { useToast } from "@/ui-components/hooks/use-toast";
import { useValtio } from "./data/valtio";
import { useSnapshot } from "valtio";
import { useState } from "react";

export function GoalCreationButton({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { goalStore, userStore } = useValtio();
  const [recommendation, setRecommendation] = useState<GoalRecommendation | null>(null);
  if (!userStore.profile) {
    throw new Error('Invariant: User profile not initialized before using GoalCreationButton')
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const profile = useSnapshot(userStore.profile!);
  const handleSubmit = async (goal: GoalInput) => {
    try {
      await goalStore.createGoal(goal);
      toast({ title: 'Goal created', description: 'Your goal has been created successfully', variant: 'default' })
    } catch (error) {
      toast({ title: 'Error creating goal', description: (error as Error).message, variant: 'destructive' })
    }
  }
  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveModalTrigger asChild>
        <ShinyButton variant="expandIcon" Icon={PlusIcon} iconPlacement="right" className={className}>
          New Goal
        </ShinyButton>
      </ResponsiveModalTrigger>
      <ResponsiveModalContent>
        <ResponsiveModalTitle className="sr-only">Set Your Goal</ResponsiveModalTitle>
        <ResponsiveModalDescription className="sr-only">This modal allows you to set a new goal and view new goal recommendations.</ResponsiveModalDescription>
        <GoalSettingsCard
          recommendation={recommendation}
          setRecommendation={setRecommendation}
          close={() => setIsOpen(false)}
          showTitle
          userId={profile.userId}
          handleSubmit={handleSubmit}
        />
        <GoalRecommendationsCard setRecommendation={setRecommendation} />
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}

export default GoalCreationButton;