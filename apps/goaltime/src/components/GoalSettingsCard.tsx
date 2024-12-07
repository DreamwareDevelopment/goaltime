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

export interface GoalSettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal?: GoalInput;
  showTitle?: boolean;
  userId: string;
  handleSubmit: (goal: GoalInput) => Promise<void>;
}

export function GoalSettingsCard({
  goal,
  showTitle = false,
  className,
  userId,
  handleSubmit
}: GoalSettingsCardProps) {
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
    console.log(formState.errors)
  }
  
  const onSubmit: SubmitHandler<GoalInput> = async (data, event) => {
    event?.preventDefault()
    await handleSubmit(data)
  }

  return (
    <Card className={cn("border-none", className)}>
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
            <ShinyButton variant="gooeyLeft" className="w-full max-w-[707px] ml-[2px] text-white" style={{ backgroundColor: form.watch('color') }}>
              {isSubmitting || isValidating ? 
                <LoadingSpinner className="h-4 w-4" /> : 
                "Save Goal"
              }
            </ShinyButton>
          </CardContent>
        </form>
      </Form>
    </Card>
  )
}
