'use client'

import React, { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'

import { CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Button as ShinyButton } from "@/ui-components/button-shiny"

import { Form } from "@/ui-components/form"
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { DaysSelectionEnum, getDefaults, getZodResolver, refineUserProfileSchema, UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { getTime } from '@/shared/utils'
import { useRouter } from 'next/navigation'
import { AvatarUrlField } from '../../components/Profile/AvatarUrlField'
import { PersonalFields } from '../../components/Profile/PersonalFields'
import { OTPField, PhoneField } from '../../components/Profile/PhoneFields'
import { RoutineFieldsContainer } from '../../components/Profile/RoutineFields'
import { WorkFields } from '../../components/Profile/WorkFields'
import { useValtio } from '../../components/data/valtio'
import { LoadingSpinner } from '@/ui-components/svgs/spinner'
import { sendOTPAction, verifyPhoneNumberAction } from '../actions/user'
import { useToast } from '@/ui-components/hooks/use-toast'
import { SanitizedUser } from '@/shared/utils'
import { WelcomeSkeleton } from './skeleton'

const steps = [
  { title: "Profile Setup", fields: ['name', 'avatarUrl', 'birthday', 'timezone', 'phone', 'preferredLanguage', 'preferredCurrency'] },
  { title: 'Verify Phone Number', fields: ['otp'] },
  { title: 'Work Details', fields: ['occupation', 'unemployed', 'workDays', 'startsWorkAt', 'endsWorkAt'] },
  { title: 'Routine', fields: ['routine'] },
]

export interface WelcomeFlowClientProps {
  user: SanitizedUser
}

export default function WelcomeFlowClient({ user }: WelcomeFlowClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { userStore } = useValtio()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const isInitialStep = currentStep === 0
  const isFinalStep = currentStep === steps.length - 1

  const [otpError, setOTPError] = useState<string | null>(null)
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [image, setImage] = useState<File | null>(null)

  const form = useForm<UserProfileInput>({
    resolver: getZodResolver(UserProfileSchema, refineUserProfileSchema),
    defaultValues: {
      ...getDefaults(UserProfileSchema),
      userId: user.id,
    }
  })
  const { handleSubmit, formState, clearErrors, setError, setValue } = form
  const { isValidating, isDirty } = formState

  useEffect(() => {
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setValue('timezone', clientTimezone)
    for (const day of Object.values(DaysSelectionEnum.Values)) {
      setValue(`routine.sleep.${day}.end`, getTime('07:00', clientTimezone).toDate())
      setValue(`routine.breakfast.${day}.start`, getTime('07:30', clientTimezone).toDate())
      setValue(`routine.breakfast.${day}.end`, getTime('08:00', clientTimezone).toDate())
      setValue(`routine.lunch.${day}.start`, getTime('12:00', clientTimezone).toDate())
      setValue(`routine.lunch.${day}.end`, getTime('13:00', clientTimezone).toDate())
      setValue(`routine.dinner.${day}.start`, getTime('18:00', clientTimezone).toDate())
      setValue(`routine.dinner.${day}.end`, getTime('19:00', clientTimezone).toDate())
      setValue(`routine.sleep.${day}.start`, getTime('23:30', clientTimezone).toDate())
    }
    setValue('startsWorkAt', getTime('08:30', clientTimezone).toDate())
    setValue('endsWorkAt', getTime('17:30', clientTimezone).toDate())
    document.getElementById('skeleton')?.remove()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (Object.keys(formState.errors).length > 0) {
    console.log('WelcomeFlowClient form errors', formState.errors)
  }

  const onSubmit: SubmitHandler<UserProfileInput> = async (profile, event) => {
    event?.preventDefault()
    setIsSubmitting(true)
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
        setIsSubmitting(false)
        return
      }
    }
    try {
      await userStore.createUserProfile(user, profile)
      console.log('Finished creating user profile')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating user profile', error)
      // TODO: Get better type checking on these error page params
      router.push(`/error?error=${error}&next=${encodeURIComponent('/login')}&solution=Please try again.`)
    }
    // Intentionally not setting isSubmitting to false here
    // Because either way we will redirect
  }

  const onOTP = (otp: string) => {
    const phone = form.getValues('phone')
    setIsVerifyingOTP(true)
    verifyPhoneNumberAction(phone, otp).then(result => {
      setIsVerifyingOTP(false)
      if (result.success) {
        setDirection(1)
        setCurrentStep(currentStep + 1)
      } else {
        setOTPError(result.message)
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const sendOTP = async (field: 'otp' | 'phone'): Promise<{ success: boolean }> => {
    try {
      setIsSendingOTP(true)
      await sendOTPAction(form.getValues('phone'))
      clearErrors('otp')
      console.log('Verification Code Sent')
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your messages for the verification code.',
      })
      return { success: true }
    } catch (error) {
      console.error('Error Sending Verification Code', error)
      setError(field, { message: `${error}` })
      return { success: false }
    } finally {
      setIsSendingOTP(false)
    }
  }

  const nextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const currentStepFields = steps[currentStep].fields
      if (currentStepFields.includes('otp')) {
        if (otpError || !form.getValues('otp')) {
          form.setError('otp', { message: otpError || 'Invalid Verification Code' })
          return
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = await form.trigger(currentStepFields as any)
      const proceed = () => {
        if (isValid && currentStep < steps.length - 1) {
          setDirection(1)
          setCurrentStep(currentStep + 1)
        }
      }
      if (currentStepFields.includes('phone') && isValid) {
        const { success } = await sendOTP('phone')
        if (success) {
          proceed()
        }
      } else {
        proceed()
      }
    } catch (error) {
      console.error('Error in nextStep function', error)
      toast({
        title: 'Error',
        description: 'An error occurred while proceeding to the next step. Please contact support@goaltime.ai',
        variant: 'destructive',
      })
    }
  }

  const prevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const currentStepFields = steps[currentStep].fields
    if (currentStepFields.includes('otp')) {
      form.setValue('otp', '')
      clearErrors('otp')
    }
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepFields = steps[currentStep].fields

  return (
    <>
      <CardHeader>
        { !currentStepFields.includes('routine') && (
          <CardTitle className="flex justify-center gap-2 w-full text-center text-xl">{steps[currentStep].title}</CardTitle>
        )}
        { currentStep === 0 && (
          <p className="text-center text-sm text-muted-foreground">Estimated time to complete: 7 minutes</p>
        )}
      </CardHeader>
      <WelcomeSkeleton />
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pl-1 sm:pl-6">
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
                {currentStepFields.includes('phone') && (
                  <PhoneField form={form} />
                )}
                {currentStepFields.includes('otp') && (
                  <>
                    <OTPField form={form} onOTP={onOTP} />
                    <div className="pt-4 flex flex-col justify-center items-center">
                      <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
                      <ShinyButton
                        variant="linkHover1"
                        type="button"
                        onClick={() => sendOTP('otp')}
                       >
                        Resend Code
                      </ShinyButton>
                    </div>
                  </>
                )}
                {currentStepFields.includes('occupation') && (
                  <WorkFields form={form} />
                )}
                {currentStepFields.includes('routine') && (
                  <RoutineFieldsContainer defaultOpen="Everyday" form={form} />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className={
            "flex flex-col-reverse sm:flex-row sm:flex-wrap items-center gap-4 " +
            (currentStep === 0 ? "justify-end" : "justify-between")
          }>
            {currentStep > 0 && (
              <ShinyButton
                disabled={isSubmitting || isValidating || isSendingOTP}
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
                disabled={isVerifyingOTP}
                className="min-w-[178px]"
                type="button"
              >
                {isSendingOTP || isVerifyingOTP ? <LoadingSpinner className="h-4 w-4" /> : 'Next'}
              </ShinyButton>
            ) : (
              <ShinyButton
                variant="gooeyLeft"
                type="submit"
                disabled={!isDirty}
                className="min-w-[178px]"
              >
                {isSubmitting || isValidating ? <LoadingSpinner className="h-4 w-4" /> : 'Prepare Goals'}
              </ShinyButton>
            )}
          </CardFooter>
        </form>
      </Form>
    </>
  )
}
