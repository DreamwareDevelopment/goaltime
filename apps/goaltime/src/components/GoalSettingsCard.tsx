import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import React, { useRef, useState } from 'react'

import { cn } from "@/ui-components/utils"
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card'
import { Form } from '@/ui-components/form'
import { getDefaults, getZodResolver, GoalInput, GoalSchema, NotificationSettingsSchema } from '@/shared/zod'

import { NotificationSettings } from './Settings/Notifications'
import { PreferredTimes } from './Settings/TimeInputs.tsx'
import { ColorPicker } from './Settings/ColorPicker'
import { PrioritySelector } from './Settings/PrioritySelector'
import { DescriptionInput, TitleInput } from './Settings/Inputs'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { useValtio } from './data/valtio'
import { GoalRecommendation } from './GoalRecommendationsCard'
import { getDistinctColor } from '@/libs/shared/src'
import { useSnapshot } from 'valtio'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/ui-components/dialog"
import { Button } from "@/ui-components/button"
import { GoalTypeInput } from './Settings/GoalTypeInput'
import { Separator } from '@/ui-components/separator'

export interface GoalSettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal?: GoalInput;
  showTitle?: boolean;
  recommendation?: GoalRecommendation | null;
  setRecommendation?: (recommendation: GoalRecommendation | null) => void;
  handleSubmit: (goal: GoalInput) => Promise<void>;
  close?: () => void;
}

export function GoalSettingsCard({
  goal,
  showTitle = false,
  className,
  handleSubmit,
  close,
  recommendation = null,
  setRecommendation,
}: GoalSettingsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { goalStore, userStore } = useValtio()
  const { deleteGoal } = goalStore
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const profile = useSnapshot(userStore.profile!)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const goals = useSnapshot(goalStore.goals!)
  // TODO: Calculate a globally unused color
  const memoizedGetDistinctColor = React.useCallback(() => getDistinctColor(goals.map(g => g.color)), [goals]);
  const color = goal?.color ?? memoizedGetDistinctColor();
  const form = useForm<GoalInput>({
    resolver: getZodResolver(GoalSchema, async (data) => {
      const errors: FieldErrors<GoalInput> = {}
      if (!data.commitment && !data.estimate && !data.deadline) {
        errors.commitment = {
          type: 'validate',
          message: 'Must set either commitment or deadline w/ estimate',
        }
        errors.estimate = {
          type: 'validate',
          message: 'Must set either commitment or deadline w/ estimate',
        }
      } else if (data.commitment && (data.estimate || data.deadline)) {
        errors.commitment = {
          type: 'validate',
          message: 'Cannot set both commitment and deadline / estimate',
        }
        errors.estimate = {
          type: 'validate',
          message: 'Cannot set both commitment and deadline / estimate',
        }
      } else if (data.deadline && !data.estimate) {
        errors.deadline = {
          type: 'validate',
          message: 'Deadline requires an estimate',
        }
      } else if (!data.deadline && data.estimate) {
        errors.estimate = {
          type: 'validate',
          message: 'Estimate requires a deadline',
        }
      }
      return errors
    }),
    defaultValues: {
      ...getDefaults(GoalSchema, { userId: profile.userId, color }),
      ...goal,
      notifications: goal?.notifications ?
        { ...goal.notifications, phone: profile.phone } :
        getDefaults(NotificationSettingsSchema, { userId: profile.userId, goalId: goal?.id, phone: profile.phone }),
    }
  })

  // Move recommendation handling to useEffect
  React.useEffect(() => {
    if (recommendation) {
      form.clearErrors()
      const fields = form.control._fields
      for (const key in recommendation) {
        if (key in fields) {
          console.log(`Setting ${key} to ${recommendation[key as keyof GoalRecommendation]}`)
          form.setValue(key as keyof GoalInput, recommendation[key as keyof GoalRecommendation])
        }
      }
      setRecommendation?.(null)
      cardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [recommendation, form, setRecommendation])

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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!goal || !goal.userId) {
      throw new Error('Invariant: goal or userId not defined in handleDelete')
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await deleteGoal(goal.id!, goal.userId)
    setShowDeleteDialog(false)
    close?.()
  }

  const stopPropagation = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
  };

  const deleteDialog = (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogPortal>
        <DialogContent className="p-4">
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription className="mt-2">
              Are you sure you want to delete this goal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )

  return (
    <div onClick={close}>
      {deleteDialog}
      <Card ref={cardRef} className={cn("border-none", className)} onClick={stopPropagation} onTouchMove={stopPropagation}>
        { showTitle && <CardHeader className="pb-5">
          <CardTitle className="text-2xl font-bold">Set Your Goal</CardTitle>
        </CardHeader> }
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <TitleInput form={form} />
              <DescriptionInput form={form} />
              <GoalTypeInput form={form} goal={goal} />
              <Separator />
              <PrioritySelector form={form} />
              <PreferredTimes form={form} />
              <NotificationSettings form={form} />
              <div className="flex flex-col justify-center items-center gap-4 w-full">
                <div className="flex flex-row gap-4 w-full">
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
                <ColorPicker form={form} />
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
