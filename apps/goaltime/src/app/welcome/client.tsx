'use client'

import React, { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'

import { CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Button as ShinyButton } from "@/ui-components/button-shiny"

import { Form } from "@/ui-components/form"
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getDefaults, getZodResolver, refineUserProfileSchema, UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { getTime } from '@/shared/utils'
import { useRouter } from 'next/navigation'
import { AvatarUrlField } from '../../components/Profile/AvatarUrlField'
import { PersonalFields } from '../../components/Profile/PersonalFields'
import { OTPField, PhoneField } from '../../components/Profile/PhoneFields'
import { PreferencesFields } from '../../components/Profile/PreferencesFields'
import { WorkFields } from '../../components/Profile/WorkFields'
import { useValtio } from '../../components/data/valtio'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { sendOTPAction, verifyPhoneNumberAction } from '../actions/user'
import { useToast } from '@/libs/ui-components/src/hooks/use-toast'

const steps = [
  { title: "Profile Setup", fields: ['name', 'avatarUrl', 'birthday', 'timezone', 'phone'] },
  { title: 'Verify Phone Number', fields: ['otp'] },
  { title: 'Work Details', fields: ['occupation', 'unemployed', 'workDays', 'startsWorkAt', 'endsWorkAt'] },
  { title: 'Preferences', fields: ['preferredLanguage', 'preferredCurrency', 'preferredWakeUpTime', 'preferredSleepTime'] },
]

export interface WelcomeFlowClientProps {
  userId: string
}

export default function WelcomeFlowClient({ userId }: WelcomeFlowClientProps) {
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
      userId,
    }
  })
  const { handleSubmit, formState, clearErrors, setError, setValue } = form
  const { isValidating, isDirty } = formState

  useEffect(() => {
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setValue('timezone', clientTimezone)
    setValue('preferredWakeUpTime', getTime('07:00', clientTimezone).toDate())
    setValue('preferredSleepTime', getTime('23:00', clientTimezone).toDate())
    setValue('startsWorkAt', getTime('08:30', clientTimezone).toDate())
    setValue('endsWorkAt', getTime('17:30', clientTimezone).toDate())
  }, [setValue])

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
      await userStore.createUserProfile(profile)
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
        <CardTitle className="flex justify-center gap-2 w-full text-center">{steps[currentStep].title}</CardTitle>
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
                {currentStepFields.includes('phone') && (
                  <PhoneField form={form} className="pt-4" />
                )}
                {currentStepFields.includes('otp') && (
                  <>
                    <OTPField form={form} onOTP={onOTP} />
                    <div className="pt-4 flex flex-col justify-center items-center">
                      <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
                      <ShinyButton
                        variant="linkHover2"
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
                {currentStepFields.includes('preferredWakeUpTime') && currentStepFields.includes('preferredSleepTime') && (
                  <PreferencesFields form={form} />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between items-center gap-4 w-full">
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
                className="ml-auto min-w-[178px]"
                type="button"
              >
                {isSendingOTP || isVerifyingOTP ? <LoadingSpinner className="h-4 w-4" /> : 'Next'}
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
    </>
  )
}
