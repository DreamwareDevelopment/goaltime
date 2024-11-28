import { ArrowRightIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"

import { LoginSchema } from '@/shared'
import { useToast } from '@/ui-components/hooks/use-toast'
import { cn } from '@/libs/ui-components/src/utils'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/ui-components/form'
import { Input } from '@/ui-components/input'

export interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  login: (formData: z.infer<typeof LoginSchema>) => Promise<void>
}

export function LoginForm({ className, login, ...props }: LoginFormProps) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  if (searchParams?.get('error')) {
    toast({
      variant: 'destructive',
      title: 'Error logging in',
      description: searchParams.get('error'),
    })
  }

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onLogin(data: z.infer<typeof LoginSchema>) {
    if (!login) throw new Error('Login function is not defined')
    await login(data)
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onLogin)}>
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
                    <Input type="password" autoComplete="current-password" placeholder="Password..." {...field} />
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
                  Login with Email
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
