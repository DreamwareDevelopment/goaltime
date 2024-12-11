"use client"

import { PlusIcon } from "lucide-react";

import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger, CredenzaBody } from "@/ui-components/credenza";

import { GoalRecommendation, GoalRecommendationsCard } from "./GoalRecommendationsCard";
import { GoalSettingsCard } from "./GoalSettingsCard";
import { ScrollArea } from "@/ui-components/scroll-area";
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
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaTrigger asChild>
        <ShinyButton variant="expandIcon" Icon={PlusIcon} iconPlacement="right" className={className}>
          New Goal
        </ShinyButton>
      </CredenzaTrigger>
      <CredenzaContent className="h-[calc(100vh-100px)] md:h-[85vh]">
        <ScrollArea className="h-full w-full">
          <CredenzaHeader>
            <CredenzaTitle className="sr-only">Set Your Goal</CredenzaTitle>
            <CredenzaDescription className="sr-only">This modal allows you to set a new goal and view new goal recommendations.</CredenzaDescription>
            <GoalRecommendationsCard setRecommendation={setRecommendation} />
          </CredenzaHeader>
          <CredenzaBody className="pr-4">
            <GoalSettingsCard
              recommendation={recommendation}
              setRecommendation={setRecommendation}
              close={() => setIsOpen(false)}
              showTitle
              userId={profile.userId}
              handleSubmit={handleSubmit}
            />
          </CredenzaBody>
        </ScrollArea>
      </CredenzaContent>
    </Credenza>
  )
}

export default GoalCreationButton;