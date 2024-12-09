import { SubmitHandler, useForm } from 'react-hook-form'
import React from 'react'

import { cn } from "@/ui-components/utils"
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card'
import { Form } from '@/ui-components/form'
import { getDefaults, getZodResolver, GoalInput, GoalSchema, NotificationSettingsSchema } from '@/shared/zod'

import { NotificationSettings } from './Settings/Notifications'
import { PreferredTimes } from './Settings/PreferredTimes'
import { ColorPicker } from './Settings/ColorPicker'
import { PrioritySelector } from './Settings/PrioritySelector'
import { CommitmentInput, DescriptionInput, TitleInput } from './Settings/Inputs'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { useValtio } from './data/valtio'

export interface GoalSettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal?: GoalInput;
  showTitle?: boolean;
  userId: string;
  handleSubmit: (goal: GoalInput) => Promise<void>;
  close?: () => void;
}

export function GoalSettingsCard({
  goal,
  showTitle = false,
  className,
  userId,
  handleSubmit,
  close
}: GoalSettingsCardProps) {
  const { goalStore: { deleteGoal } } = useValtio()

  // TODO: Calculate a globally unused color
  const color = goal?.color ?? 'red';
  const form = useForm<GoalInput>({
    resolver: getZodResolver(GoalSchema),
    defaultValues: {
      ...getDefaults(GoalSchema, { userId, color }),
      ...goal,
      notifications: goal?.notifications ?
        goal.notifications :
        getDefaults(NotificationSettingsSchema, { userId, goalId: goal?.id }),
    }
  })
  const { formState } = form
  const { isSubmitting, isValidating } = formState

  if (Object.keys(formState.errors).length > 0) {
    console.log(`GoalSettingsCard form errors`, formState.errors)
  }
  
  const onSubmit: SubmitHandler<GoalInput> = async (data, event) => {
    event?.preventDefault()
    await handleSubmit(data)
    close?.()
  }

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    if (!goal || !goal.userId) {
      throw new Error('Invariant: goal or userId not defined in handleDelete')
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await deleteGoal(goal.id!, goal.userId)
  }

  const stopPropagation = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
  };

  return (
    <div onClick={close}>
      <Card className={cn("border-none", className)} onClick={stopPropagation} onTouchMove={stopPropagation}>
        { showTitle && <CardHeader className="pb-5">
          <CardTitle className="text-2xl font-bold">Set Your Goal</CardTitle>
        </CardHeader> }
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <TitleInput form={form} />
              <DescriptionInput form={form} />
              <div className="flex flex-row flex-wrap w-full gap-5">
                <CommitmentInput form={form} />
                <PrioritySelector form={form} />
                <ColorPicker form={form} />
              </div>
              <PreferredTimes form={form} />
              <NotificationSettings form={form} />
              <div className="flex flex-row gap-4">
                <ShinyButton variant="gooeyLeft" className="flex-1 max-w-[707px] ml-[2px] h-[62px] text-white" style={{ backgroundColor: form.watch('color') }}>
                  {isSubmitting || isValidating ? 
                    <LoadingSpinner className="h-4 w-4" /> : 
                    "Save Goal"
                  }
                </ShinyButton>
                { goal && (
                  <ShinyButton variant="outline" onClick={handleDelete} className="h-[63px] text-destructive bg-destructive/10 hover:bg-destructive/20">
                    Delete Goal
                  </ShinyButton>
                )}
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
