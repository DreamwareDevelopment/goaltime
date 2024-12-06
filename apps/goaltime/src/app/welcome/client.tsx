'use client'

import React, { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Button as ShinyButton } from "@/ui-components/button-shiny"

import { Form } from "@/ui-components/form"
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getDefaults, getZodResolver, refineUserProfileSchema, UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { getTime } from '@/shared/utils'
import { useRouter } from 'next/navigation'
import { AvatarUrlField } from '../../components/Profile/AvatarUrlField'
import { PersonalFields } from '../../components/Profile/PersonalFields'
import { WorkFields } from '../../components/Profile/WorkFields'
import { PreferencesFields } from '../../components/Profile/PreferencesFields'
import { useValtio } from '../../components/data/valtio'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'

const steps = [
  { title: 'Basic Info', fields: ['name', 'avatarUrl', 'birthday', 'timezone'] },
  { title: 'Work Details', fields: ['occupation', 'worksRemotely', 'daysInOffice', 'leavesHomeAt', 'returnsHomeAt'] },
  { title: 'Preferences', fields: ['preferredLanguage', 'preferredCurrency', 'preferredWakeUpTime', 'preferredSleepTime'] },
]

export interface WelcomeFlowClientProps {
  userId: string
}

export default function WelcomeFlowClient({ userId }: WelcomeFlowClientProps) {
  const router = useRouter()
  const { userStore } = useValtio()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const isInitialStep = currentStep === 0
  const isFinalStep = currentStep === steps.length - 1

  const [image, setImage] = useState<File | null>(null)

  const form = useForm<UserProfileInput>({
    resolver: getZodResolver(UserProfileSchema, refineUserProfileSchema),
    defaultValues: {
      ...getDefaults(UserProfileSchema),
      userId,
    }
  })
  const { handleSubmit, formState, setError, setValue } = form
  const { isSubmitting, isValidating, isDirty } = formState

  useEffect(() => {
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setValue('timezone', clientTimezone)
    setValue('preferredWakeUpTime', getTime('07:00', clientTimezone).toDate())
    setValue('preferredSleepTime', getTime('23:00', clientTimezone).toDate())
    setValue('leavesHomeAt', getTime('08:30', clientTimezone).toDate())
    setValue('returnsHomeAt', getTime('17:30', clientTimezone).toDate())
  }, [setValue])

  if (Object.keys(formState.errors).length > 0) {
    console.log('errors', formState.errors)
  }

  const onSubmit: SubmitHandler<UserProfileInput> = async (profile, event) => {
    event?.preventDefault()
    if (image) {
      try {
        const imageUrl = await userStore.uploadProfileImage(profile.userId, image)
        if (userStore.profile) {
          userStore.profile.avatarUrl = imageUrl
        }
        profile.avatarUrl = imageUrl
      } catch (error) {
        console.error('error uploading profile image', error)
        setError('avatarUrl', { message: `Error uploading profile image: ${error}` })
        return
      }
    }
    try {
      await userStore.createUserProfile(profile)
      console.log('done creating user profile')
      router.push('/dashboard')
    } catch (error) {
      console.error('error creating user profile', error)
      // TODO: Get better type checking on these error page params
      router.push(`/error?error=${error}&next=${encodeURIComponent('/login')}&solution=Please try again.`)
    }
  }

  const nextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const currentStepFields = steps[currentStep].fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await form.trigger(currentStepFields as any)
    if (isValid && currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepFields = steps[currentStep].fields

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardHeader>
        <CardTitle className="flex justify-center gap-2 w-full">Welcome! Let&apos;s set up your profile</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: isInitialStep && direction === 1 ? 0 : direction * 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: isInitialStep ? -300 : isFinalStep ? 300 : -direction * 300, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepFields.includes('avatarUrl') && (
                  <AvatarUrlField form={form} setImage={setImage} />
                )}
                {currentStepFields.includes('name') && currentStepFields.includes('birthday') && (
                  <PersonalFields form={form} />
                )}
                {currentStepFields.includes('occupation') && (
                  <WorkFields form={form} />
                )}
                {currentStepFields.includes('preferredWakeUpTime') && currentStepFields.includes('preferredSleepTime') && (
                  <PreferencesFields form={form} />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between items-center gap-4 w-full">
            {currentStep > 0 && (
              <ShinyButton
                onClick={prevStep}
                variant="expandIcon"
                Icon={ArrowLeft}
                iconPlacement="left"
                type="button"
                className="min-w-[178px] bg-accent text-accent-foreground hover:bg-accent/80"
              >
                Previous
              </ShinyButton>
            )}
            {currentStep < steps.length - 1 ? (
              <ShinyButton
                variant="expandIcon"
                Icon={ArrowRight}
                iconPlacement="right"
                onClick={nextStep}
                className="ml-auto min-w-[178px]"
                type="button"
              >
                Next
              </ShinyButton>
            ) : (
              <ShinyButton
                variant="gooeyLeft"
                type="submit"
                disabled={!isDirty}
                className="ml-auto min-w-[178px]"
              >
                {isSubmitting || isValidating ? <LoadingSpinner className="h-4 w-4" /> : 'Prepare Goals'}
              </ShinyButton>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
