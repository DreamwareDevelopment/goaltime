'use client'

import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import Link from 'next/link'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Button as ShinyButton } from "@/ui-components/button-shiny"

import { Form } from "@/ui-components/form"
import { Separator } from '@/ui-components/separator'
import { DaysOfTheWeekType, getProfileRoutine, getZodResolver, refineUserProfileSchema, SupportedCurrenciesType, SupportedLanguagesType, UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { useRouter } from 'next/navigation'
import { AvatarUrlField } from '../../components/Profile/AvatarUrlField'
import { PersonalFields } from '../../components/Profile/PersonalFields'
import { WorkFields } from '../../components/Profile/WorkFields'
import { RoutineFieldsContainer } from '../../components/Profile/RoutineFields'
import { useValtio } from '../../components/data/valtio'
import { UserProfile } from '@prisma/client'
import { useSnapshot } from 'valtio'
import { toast } from '@/ui-components/hooks/use-toast'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { ArrowLeft, ExternalLinkIcon } from 'lucide-react'

export interface SettingsClientProps {
  profile: UserProfile
}

export default function SettingsClient({ profile: p }: SettingsClientProps) {
  const router = useRouter()
  const { userStore } = useValtio()
  userStore.profile = p
  const profile = useSnapshot(userStore.profile)
  const [image, setImage] = useState<File | null>(null)

  const routine = getProfileRoutine(profile, false)
  // console.log(`routine: ${JSON.stringify(routine, null, 2)}`)
  const form = useForm<UserProfileInput>({
    resolver: getZodResolver(UserProfileSchema, refineUserProfileSchema),
    values: {
      ...profile,
      workDays: profile.workDays as DaysOfTheWeekType[],
      routine,
      preferredLanguage: profile.preferredLanguage as SupportedLanguagesType,
      preferredCurrency: profile.preferredCurrency as SupportedCurrenciesType,
    },
  })
  const { handleSubmit, formState, setError } = form
  const { isSubmitting, isValidating, isDirty } = formState

  if (Object.keys(formState.errors).length > 0) {
    console.log('SettingsClient form errors', formState.errors)
  }

  // Unfortunately, it seems react-hook-form seems to be copying the proxy object, 
  // so we need to update both the proxy and the form state
  const onSubmit: SubmitHandler<UserProfileInput> = async (profile, event) => {
    event?.preventDefault()
    if (!isDirty) {
      toast({
        variant: 'default',
        title: 'No changes to save',
      })
      return
    }
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
      await userStore.updateUserProfile(p, profile)
      toast({
        variant: 'default',
        title: 'Profile updated',
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('error updating user profile', error)
      // TODO: Get better type checking on these error page params
      router.push(`/error?error=${error}&next=${encodeURIComponent('/login')}&solution=Please try again.`)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardHeader className="flex flex-col">
        <div className="flex justify-between items-center w-full">
          <ShinyButton
            variant="expandIcon"
            Icon={ArrowLeft}
            iconPlacement="left"
            type="button"
            onClick={() => router.push('/dashboard')}
            className="min-w-[178px] bg-background hover:bg-background text-accent-foreground"
          >
            Dashboard
          </ShinyButton>
          <Link target="_blank" href={process.env.NODE_ENV === 'development' ? 'https://billing.stripe.com/p/login/test_4gweWFcuU1MZbraaEE' : 'https://billing.stripe.com/p/login/14kaER7QUfR961G000'}>
            <ShinyButton variant="expandIcon" Icon={ExternalLinkIcon} iconPlacement="right" className="bg-background hover:bg-background text-accent-foreground">
              <span className="">Manage Subscription</span>
            </ShinyButton>
          </Link>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Edit Profile</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <AvatarUrlField form={form} setImage={setImage} />
            <Separator />
            <div className="flex flex-col">
              <p className="text-xl text-foreground text-center">Personal</p>
              <PersonalFields form={form} />
            </div>
            <Separator />
            <p className="text-xl text-foreground text-center">Work</p>
            <WorkFields form={form} />
            <Separator />
            <RoutineFieldsContainer form={form} />
          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:flex-wrap items-center justify-between gap-4">
            <ShinyButton
              variant="expandIcon"
              Icon={ArrowLeft}
              iconPlacement="left"
              type="button"
              onClick={() => router.push('/dashboard')}
              className="min-w-[178px] bg-background hover:bg-background text-accent-foreground"
            >
              Back
            </ShinyButton>
            <ShinyButton
              variant="gooeyLeft"
              type="submit"
              disabled={!isDirty}
              className="min-w-[178px]"
            >
              {isSubmitting || isValidating ? <LoadingSpinner className="h-4 w-4" /> : 'Save Changes'}
            </ShinyButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
