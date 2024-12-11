import { ArrowRightIcon } from 'lucide-react'
import React from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from '@/ui-components/utils'
import { LoadingSpinner } from '@/ui-components/svgs/spinner'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/ui-components/form'
import { Input } from '@/ui-components/input'
import { LoginSchema } from '@/shared/zod'

export interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  login: (formData: z.infer<typeof LoginSchema>) => Promise<void>
  email?: string
}

export function LoginForm({ className, login, email, ...props }: LoginFormProps) {
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: email || '',
      password: '',
    },
  })
  const { handleSubmit, formState, setError } = form
  const { isSubmitting, isValidating } = formState

  const onSubmit: SubmitHandler<z.infer<typeof LoginSchema>> = async (data, event) => {
    event?.preventDefault()
    try {
      await login(data)
      console.log('Login success')
    } catch (error) {
      console.error('Login form error', error)
      setError('root', { message: "Invalid email or password" }, { shouldFocus: true })
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
                    <Input type="password" autoComplete="current-password" placeholder="Password..." {...field} />
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
                type="submit"
              >
                {isSubmitting || isValidating ? <LoadingSpinner className="h-4 w-4" /> : 'Login with Email'}
              </ShinyButton>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
