'use client'

import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FloatingLabelInput } from "@/ui-components/floating-input";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { MilestoneInput, MilestoneViewEnum } from "@/shared/zod";
import { useValtio } from "./data/valtio";
import { useToast } from "@/ui-components/hooks/use-toast";
import { Form, FormField } from "@/ui-components/form";

export interface MilestoneCreationFormProps {
  goalId: string
  userId: string
  view: z.infer<typeof MilestoneViewEnum>
}

export function MilestoneCreationForm({ goalId, userId, view }: MilestoneCreationFormProps) {
  const { goalStore } = useValtio()
  const { toast } = useToast()
  const form = useForm<MilestoneInput>({
    defaultValues: {
      goalId,
      userId,
      text: "",
      view,
    },
  })
  const { handleSubmit } = form

  const onSubmit = async (data: MilestoneInput) => {
    try {
      await goalStore.createMilestone(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error creating milestone",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      form.reset()
    }
  }

  return (
    <li>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-4 pt-4 pr-3">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FloatingLabelInput
                id={`new-milestone-${goalId}`}
                className="flex-grow"
                type="text"
                label="I will..."
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSubmit(onSubmit)(e)}
                {...field}
              />
            )}
          />
          <ShinyButton
            variant="expandIcon"
            Icon={PlusIcon}
            iconPlacement="right"
            className="h-[51px]"
            type="submit"
          >Add</ShinyButton>
        </form>
      </Form>
    </li>
  )
}