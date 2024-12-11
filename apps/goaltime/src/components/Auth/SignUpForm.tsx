import { ArrowRightIcon } from 'lucide-react'
import React from 'react'
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

import { cn } from "@/ui-components/utils"
import { LoadingSpinner } from '@/ui-components/svgs/spinner'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/ui-components/form'
import { Input } from '@/ui-components/input'
import { getZodResolver, SignUpSchema } from '@/shared/zod'

export interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {
  signup: (formData: z.infer<typeof SignUpSchema>) => Promise<void>
  email?: string
}

type FormData = z.infer<typeof SignUpSchema>

export function SignUpForm({ className, signup, email, ...props }: SignUpFormProps) {
  const form = useForm<FormData>({
    resolver: getZodResolver(SignUpSchema, async (data) => {
      const errors: FieldErrors<FormData> = {}
      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = {
          type: 'validate',
          message: 'Passwords do not match',
        }
      }
      return errors
    }),
    defaultValues: {
      email: email || '',
      password: '',
      confirmPassword: '',
    },
  })
  const { handleSubmit, formState, setError } = form
  const { isSubmitting, isValidating } = formState

  const onSubmit: SubmitHandler<z.infer<typeof SignUpSchema>> = async (data, event) => {
    event?.preventDefault()
    if (!signup) throw new Error('Signup function is not defined')
    try {
      await signup(data)
      console.log('Signup success')
    } catch (error) {
      console.error('Signup error', error)
      setError('root', { message: 'Sign up failed, try again later...' }, { shouldFocus: true })
    }
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only pl-2">Email</FormLabel>
                  <FormControl>
                    <Input autoComplete="email" placeholder="Email..." {...field} />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only pl-2">Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="Password..." {...field} />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only pl-2">Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="Confirm password..." {...field} />
                  </FormControl>
                  <FormMessage className="pl-2" />
                  {formState.errors.root && (
                    <div className="text-sm text-destructive bg-secondary w-full p-1 rounded-md">
                      {formState.errors.root.message}
                    </div>
                  )}
                </FormItem>
              )}
            />
            <div className="flex justify-center pt-6">
              <ShinyButton
                variant="expandIcon"
                Icon={ArrowRightIcon}
                iconPlacement="right"
                className="w-full"
              >
                {isSubmitting || isValidating ? <LoadingSpinner className="h-4 w-4" /> : 'Sign Up with Email'}
              </ShinyButton>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
