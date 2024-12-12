'use client'

import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FloatingLabelInput } from "@/ui-components/floating-input";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { MilestoneInput, MilestoneViewEnum } from "@/shared/zod";
import { useValtio } from "./data/valtio";
import { useToast } from "@/ui-components/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";

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
  const { handleSubmit, setError } = form

  const onSubmit = async (data: MilestoneInput) => {
    if (!data.text) {
      setError('text', { message: 'Text is required' })
      return
    }
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
    <li className="w-full">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-start gap-4 md:pt-4 md:pr-3">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl className="w-full">
                  <FloatingLabelInput
                    id={`new-milestone-${goalId}`}
                    type="text"
                    label="I will..."
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSubmit(onSubmit)(e)}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ShinyButton
            variant="expandIcon"
            Icon={PlusIcon}
            iconPlacement="right"
            className="h-[51px] flex-grow md:flex-none"
            type="submit"
          >Add</ShinyButton>
        </form>
      </Form>
    </li>
  )
}