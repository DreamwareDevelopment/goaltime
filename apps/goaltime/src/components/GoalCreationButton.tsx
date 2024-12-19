"use client"

import { PlusIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useSnapshot } from "valtio";

import { GoalInput } from "@/shared/zod";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger, CredenzaBody } from "@/ui-components/credenza";
import { useToast } from "@/ui-components/hooks/use-toast";
import { ScrollArea } from "@/ui-components/scroll-area";
import { LoadingSpinner } from "@/ui-components/svgs/spinner";

import { GoalRecommendation, GoalRecommendationsCard } from "./GoalRecommendationsCard";
import { useValtio } from "./data/valtio";

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
      onDidCreate?.();
    } catch (error) {
      toast({ title: 'Error creating goal', description: (error as Error).message, variant: 'destructive' })
    }
  }
  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaTrigger asChild>
        <ShinyButton variant="expandIcon" Icon={PlusIcon} iconPlacement="right" className={className}>
          <span className="hidden sm:block">New Goal</span>
          <span className="block sm:hidden"><PlusIcon className="w-6 h-6" /></span>
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