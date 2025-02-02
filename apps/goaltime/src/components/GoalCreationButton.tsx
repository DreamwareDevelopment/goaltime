"use client"

import { PlusIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { GoalInput } from "@/shared/zod";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger, CredenzaBody } from "@/ui-components/credenza";
import { toast } from "@/ui-components/hooks/use-toast";
import { ScrollArea } from "@/ui-components/scroll-area";
import { LoadingSpinner } from "@/ui-components/svgs/spinner";

import { GoalRecommendation, GoalRecommendationsCard } from "./GoalRecommendationsCard";
import { useValtio } from "./data/valtio";
import { cn } from "@/ui-components/utils";

const GoalSettingsCard = dynamic(() => import('./GoalSettingsCard.tsx').then(mod => mod.GoalSettingsCard), {
  loading: () => <LoadingSpinner />
});

interface GoalCreationButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  onDidCreate?: () => void
}

export function GoalCreationButton({
  onDidCreate,
  className
}: GoalCreationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { goalStore, userStore } = useValtio();
  const [recommendation, setRecommendation] = useState<GoalRecommendation | null>(null);
  if (!userStore.profile) {
    throw new Error('Invariant: User profile not initialized before using GoalCreationButton')
  }
  const handleSubmit = async (goal: GoalInput) => {
    try {
      await goalStore.createGoal(goal);
      toast({ title: 'Goal created', description: 'Your goal has been created successfully', variant: 'default' })
      onDidCreate?.();
    } catch (error) {
      toast({ title: 'Error creating goal', description: (error as Error).message, variant: 'destructive' })
    }
  }
  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaTrigger asChild>
        <>
          <ShinyButton variant="expandIcon" Icon={PlusIcon} iconPlacement="right" className={cn(className, "hidden sm:flex")} onClick={() => setIsOpen(true)}>
            New Goal
          </ShinyButton>
          <ShinyButton variant="gooeyLeft" className={cn(className, "flex sm:hidden")} onClick={() => setIsOpen(true)}>
            <PlusIcon className="w-6 h-6" />
          </ShinyButton>
        </>
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
              handleSubmit={handleSubmit}
            />
          </CredenzaBody>
        </ScrollArea>
      </CredenzaContent>
    </Credenza>
  )
}

export default GoalCreationButton;