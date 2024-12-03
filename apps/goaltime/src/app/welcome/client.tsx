'use client'

import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Button } from "@/ui-components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui-components/select"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getDefaults, UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { Input } from '@/libs/ui-components/src/components/ui/input'
import { dayjs, getTime } from '@/shared/utils'
import { userStore } from '../proxies/user'
import { useRouter } from 'next/navigation'
import { AvatarUrlField } from '../../components/Profile/AvatarUrlField'
import { PersonalFields } from '../../components/Profile/PersonalFields'
import { WorkFields } from '../../components/Profile/WorkFields'

const steps = [
  { title: 'Basic Info', fields: ['name', 'avatarUrl', 'birthday'] },
  { title: 'Work Details', fields: ['occupation', 'worksRemotely', 'daysInOffice', 'leavesHomeAt', 'returnsHomeAt'] },
  { title: 'Preferences', fields: ['preferredLanguage', 'preferredCurrency', 'preferredWakeUpTime', 'preferredSleepTime', 'timezone'] },
]

export interface WelcomeFlowClientProps {
  userId: string
}

export default function WelcomeFlowClient({ userId }: WelcomeFlowClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const isInitialStep = currentStep === 0
  const isFinalStep = currentStep === steps.length - 1
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supportedTimezones = (Intl as any).supportedValuesOf('timeZone');
  const defaultLeavesHomeAt = getTime('08:30', timezone)
  const defaultReturnsHomeAt = getTime('17:30', timezone)
  const defaultWakeUpTime = getTime('07:00', timezone)
  const defaultSleepTime = getTime('23:00', timezone)

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      userId,
      ...getDefaults(UserProfileSchema),
      timezone,
      preferredWakeUpTime: defaultWakeUpTime,
      preferredSleepTime: defaultSleepTime,
      leavesHomeAt: defaultLeavesHomeAt,
      returnsHomeAt: defaultReturnsHomeAt,
    },
  })

  if (form.formState.errors) {
    console.log('errors', form.formState.errors)
  }

  const onSubmit: SubmitHandler<UserProfileInput> = (data) => {
    console.log('submitting', data)
    userStore.createUserProfile(data).then(() => {
      console.log('done creating user profile')
      router.push('/dashboard')
    }).catch(error => {
      console.error('error creating user profile', error)
      // TODO: Get better type checking on these error page params
      router.push(`/error?error=${error}&next=${encodeURIComponent('/login')}&solution=Please try again.`)
    })
  }

  const nextStep = async () => {
    const currentStepFields = steps[currentStep].fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await form.trigger(currentStepFields as any)
    if (isValid && currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                  <AvatarUrlField form={form} />
                )}
                {currentStepFields.includes('name') && currentStepFields.includes('birthday') && (
                  <PersonalFields form={form} />
                )}
                {currentStepFields.includes('occupation') && (
                  <WorkFields form={form} timezone={timezone} defaults={{ leavesHomeAt: defaultLeavesHomeAt, returnsHomeAt: defaultReturnsHomeAt }} />
                )}
                {currentStepFields.includes('preferredLanguage') && (
                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel className="pl-2">
                          Preferred Language
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                {currentStepFields.includes('preferredCurrency') && (
                  <FormField
                    control={form.control}
                    name="preferredCurrency"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel className="pl-2">
                          Preferred Currency
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                {currentStepFields.includes('timezone') && (
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel className="pl-2">
                          Timezone
                        </FormLabel>
                        <Select onValueChange={setTimezone} defaultValue={timezone}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {supportedTimezones.map((supportedTimezone: string) => (
                              <SelectItem key={supportedTimezone} value={supportedTimezone}>{supportedTimezone}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex flex-wrap gap-8">
                  {currentStepFields.includes('preferredWakeUpTime') && (
                    <FormField
                      control={form.control}
                      name="preferredWakeUpTime"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel className="pl-2">
                            Normal Wake Up Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              value={field.value ? dayjs(field.value).format('HH:mm') : ''}
                              onChange={(e) => field.onChange(getTime(e.target.value, timezone))}
                            />
                          </FormControl>
                          <FormMessage className="pl-2" />
                        </FormItem>
                      )}
                    />
                  )}
                  {currentStepFields.includes('preferredSleepTime') && (
                    <FormField
                      control={form.control}
                      name="preferredSleepTime"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel className="pl-1">
                            Normal Sleep Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              value={field.value ? dayjs(field.value).format('HH:mm') : ''}
                              onChange={(e) => field.onChange(getTime(e.target.value, timezone))}
                            />
                          </FormControl>
                          <FormMessage className="pl-2" />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentStep > 0 && (
              <Button onClick={prevStep} variant="outline" type="button">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} className="ml-auto" type="button">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="ml-auto">
                Submit
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
