import { ArrowRightIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"

import { SignUpSchema } from '@/shared/zod'
import { useToast } from '@/ui-components/hooks/use-toast'
import { cn } from '@/libs/ui-components/src/utils'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/ui-components/form'
import { Input } from '@/ui-components/input'

export interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {
  signup: (formData: z.infer<typeof SignUpSchema>) => Promise<void>
}

export function SignUpForm({ className, signup, ...props }: SignUpFormProps) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  if (searchParams?.get('error')) {
    toast({
      variant: 'destructive',
      title: 'Error logging in',
      description: searchParams.get('error'),
    })
  }

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSignup(data: z.infer<typeof SignUpSchema>) {
    if (!signup) throw new Error('Signup function is not defined')
    await signup(data)
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
                </FormItem>
              )}
            />
            <div className="flex justify-center pt-6">
              {form.formState.isSubmitting && (
                <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {!form.formState.isSubmitting && (
                <ShinyButton
                  variant="expandIcon"
                  Icon={ArrowRightIcon}
                  iconPlacement="right"
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                >
                  Sign Up with Email
                </ShinyButton>
              )}
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
