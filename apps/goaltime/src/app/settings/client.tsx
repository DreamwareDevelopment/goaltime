'use client'

import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Button as ShinyButton } from "@/ui-components/button-shiny"

import { Form } from "@/ui-components/form"
import { Separator } from '@/ui-components/separator'
import { UserProfileInput, UserProfileSchema } from '@/shared/zod'
import { useRouter } from 'next/navigation'
import { AvatarUrlField } from '../../components/Profile/AvatarUrlField'
import { PersonalFields } from '../../components/Profile/PersonalFields'
import { WorkFields } from '../../components/Profile/WorkFields'
import { PreferencesFields } from '../../components/Profile/PreferencesFields'
import { useValtio } from '../../components/data/valtio'
import { UserProfile } from '@/shared/models'
import { useSnapshot } from 'valtio'
import { useToast } from '@/ui-components/hooks/use-toast'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { ArrowLeft } from 'lucide-react'

export interface SettingsClientProps {
  profile: UserProfile
}

export default function SettingsClient({ profile: p }: SettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { userStore } = useValtio()
  userStore.profile = p
  const profile = useSnapshot(userStore.profile)
  const [image, setImage] = useState<File | null>(null)

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(UserProfileSchema),
    values: profile as UserProfileInput,
  })
  const { formState } = form
  const { isSubmitting, isValidating, isDirty } = formState

  if (Object.keys(form.formState.errors).length > 0) {
    console.log('errors', form.formState.errors)
  }

  // Unfortunately, it seems react-hook-form seems to be copying the proxy object, 
  // so we need to update both the proxy and the form state
  const onSubmit: SubmitHandler<UserProfileInput> = async (profile) => {
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
        form.setError('avatarUrl', { message: `Error uploading profile image: ${error}` })
        return
      }
    }
    try {
      await userStore.updateUserProfile(profile)
      toast({
        variant: 'default',
        title: 'Profile updated',
      })
    } catch (error) {
      console.error('error creating user profile', error)
      // TODO: Get better type checking on these error page params
      router.push(`/error?error=${error}&next=${encodeURIComponent('/login')}&solution=Please try again.`)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardHeader>
        <CardTitle className="flex justify-center gap-2 w-full">Welcome! Let&apos;s set up your profile</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-6">
            <AvatarUrlField form={form} setImage={setImage} />
            <Separator />
            <PersonalFields form={form} />
            <Separator />
            <WorkFields form={form} />
            <Separator />
            <PreferencesFields form={form} />
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between w-full gap-4">
            <ShinyButton
              variant="expandIcon"
              Icon={ArrowLeft}
              iconPlacement="left"
              type="button"
              onClick={() => router.push('/dashboard')}
              className="min-w-[178px] bg-accent hover:bg-accent/80 text-accent-foreground"
            >
              Back
            </ShinyButton>
            {isSubmitting || isValidating && (
              <LoadingSpinner className="mx-auto h-4 w-4 animate-spin" />
            )}
            {!(isSubmitting || isValidating) && (
              <ShinyButton
                variant="gooeyLeft"
                type="submit"
                disabled={!isDirty}
                className="ml-auto min-w-[178px]"
              >
                Save Changes
              </ShinyButton>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
