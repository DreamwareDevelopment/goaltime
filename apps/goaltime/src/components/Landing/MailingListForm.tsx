'use client'

import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form"
import { useToast } from '@/ui-components/hooks/use-toast'
import { Input } from '@/ui-components/input'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { subscribeToMailingListAction } from '../../app/actions/user'
import { LoadingSpinner } from '@/ui-components/svgs/spinner'

const EmailSubscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type EmailSubscriptionInput = z.infer<typeof EmailSubscriptionSchema>

export default function MailingListForm() {
  const { toast } = useToast()
  const form = useForm<EmailSubscriptionInput>({
    resolver: zodResolver(EmailSubscriptionSchema),
    defaultValues: {
      email: '',
    },
  })
  const { handleSubmit, formState } = form
  const { isSubmitting, isValidating } = formState

  const router = useRouter()

  const onSubmit: SubmitHandler<EmailSubscriptionInput> = async (data, event) => {
    event?.preventDefault()
    try {
      await subscribeToMailingListAction(data.email)
      toast({
        variant: 'default',
        title: 'Thanks for subscribing!',
        description: "Sign up to achieve your goals.",
      })
      router.push('/login?type=signup&email=' + data.email)
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <div className="min-w-[200px] flex-1">
              <FormItem>
                <FormControl>
                <Input
                    placeholder="Enter your email" 
                    type="email"
                    value={field.value}
                    className="h-[63px]"
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage className="pl-2" />
              </FormItem>
            </div>
          )}
        />
        <ShinyButton 
          variant="expandIcon" 
          Icon={ArrowRight} 
          iconPlacement="right" 
          type="submit"
          className="mx-auto"
        >
          {isSubmitting || isValidating ? <LoadingSpinner className="w-4 h-4" /> : 'Set Your Goals'}
        </ShinyButton>
      </form>
    </Form>
  )
}
