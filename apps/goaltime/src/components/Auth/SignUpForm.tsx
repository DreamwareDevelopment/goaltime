import { ArrowRightIcon } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/ui-components/utils"
import { LoadingSpinner } from '@/ui-components/svgs/spinner'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/ui-components/form'
import { Input } from '@/ui-components/input'
import { SignUpSchema } from '@/shared/zod'

export interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {
  signup: (formData: z.infer<typeof SignUpSchema>) => Promise<void>
  email?: string
}

export function SignUpForm({ className, signup, email, ...props }: SignUpFormProps) {
  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: email || '',
      password: '',
      confirmPassword: '',
    },
  })
  const { formState } = form
  const { isSubmitting, isValidating } = formState

  async function onSignup(data: z.infer<typeof SignUpSchema>) {
    if (!signup) throw new Error('Signup function is not defined')
    try {
      await signup(data)
      console.log('Signup success')
    } catch (error) {
      console.error('Signup error', error)
      form.setError('root', { message: 'Sign up failed, try again later...' }, { shouldFocus: true })
    }
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSignup)}>
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
                  {form.formState.errors.root && (
                    <div className="text-sm text-destructive bg-secondary w-full p-1 rounded-md">
                      {form.formState.errors.root.message}
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <ShinyButton variant="expandIcon" Icon={ArrowRightIcon} iconPlacement="right">
        GitHub
      </ShinyButton>
    </div>
  )
}
