'use client'

import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

import { Avatar, AvatarFallback, AvatarImage } from "@/ui-components/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { FloatingLabelInput } from "@/ui-components/floating-input"
import { Button } from "@/ui-components/button"
import { Label } from "@/ui-components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui-components/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui-components/popover"
import { Calendar } from "@/ui-components/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form"
import { cn } from "@/ui-components/utils"
import { CalendarIcon, ChevronLeft, ChevronRight, Upload, User } from 'lucide-react'
import { getDefaults, UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { Input } from '@/libs/ui-components/src/components/ui/input'

const steps = [
  { title: 'Basic Info', fields: ['name', 'avatarUrl', 'birthDate'] },
  { title: 'Work Details', fields: ['occupation', 'weeklyWorkHours'] },
  { title: 'Preferences', fields: ['preferredLanguage', 'preferredCurrency', 'preferredWakeUpTime', 'preferredSleepTime', 'timezone'] },
]

export default function WelcomeFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const isInitialStep = currentStep === 0
  const isFinalStep = currentStep === steps.length - 1

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: getDefaults(UserProfileSchema),
  })

  const onSubmit: SubmitHandler<UserProfileInput> = (data) => {
    console.log(data)
    alert('Profile created successfully!')
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
        <CardTitle>Welcome! Let&apos;s set up your profile</CardTitle>
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
                {currentStepFields.includes('name') && (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormControl>
                          <FloatingLabelInput
                            type="text"
                            autoComplete="name"
                            label="Name"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                {currentStepFields.includes('avatarUrl') && (
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem className="mb-4 pl-2">
                        <FormLabel>
                          Avatar
                          <span className="text-xs text-muted-foreground">
                            &nbsp;&nbsp;(optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={field.value} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                              <AvatarFallback>
                                <User />
                              </AvatarFallback>
                            </Avatar>
                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                              <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md">
                                <Upload className="w-4 h-4" />
                                <span>Upload Image</span>
                              </div>
                              <Input
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                      field.onChange(reader.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                            </Label>
                          </div>
                        </FormControl>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                {currentStepFields.includes('birthDate') && (
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel className="pl-2">
                          Birth Date
                          <span className="text-xs text-muted-foreground">
                            &nbsp;&nbsp;(optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                {currentStepFields.includes('occupation') && (
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormControl>
                          <FloatingLabelInput type="text" autoComplete="occupation" label="Occupation  (optional)" {...field} />
                        </FormControl>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
                {currentStepFields.includes('weeklyWorkHours') && (
                  <FormField
                    control={form.control}
                    name="weeklyWorkHours"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel className="pl-2">
                          Weekly Work Hours
                          <span className="text-xs text-muted-foreground">
                            &nbsp;&nbsp;(optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
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
                            value={field.value ? format(field.value, 'HH:mm') : ''}
                            onChange={(e) => field.onChange(new Date(`1970-01-01T${e.target.value}:00`))}
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
                        <FormLabel className="pl-2">
                          Normal Sleep Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            value={field.value ? format(field.value, 'HH:mm') : ''}
                            onChange={(e) => field.onChange(new Date(`1970-01-01T${e.target.value}:00`))}
                          />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="pl-2" />
                      </FormItem>
                    )}
                  />
                )}
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