import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"

import { UserProfileInput } from "@/shared/zod"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form"
import { OtpStyledInput } from "@/ui-components/otp"
import { PhoneInput } from "@/ui-components/phone-input"

interface PhoneFieldProps {
  form: UseFormReturn<UserProfileInput>
  className?: string
}

export function PhoneField({ form, className }: PhoneFieldProps) {
  return (
    <div className={className}>
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="ml-2">Phone Number</FormLabel>
            <FormControl>
              <PhoneInput
                value={field.value}
                onChange={e => {
                  const value = '+' + e.target.value.replace(/\D/g, '');
                  field.onChange(value)
                  form.setValue('otp', '')
                }}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1 ml-2">
              By providing your phone number, you consent to receive SMS messages from us.
            </p>
            <FormMessage className="pl-2" />
          </FormItem>
        )}
      />
    </div>
  )
}

interface OTPFieldProps {
  onOTP: (otp: string) => void
  form: UseFormReturn<UserProfileInput>
}

export const OTP_LENGTH = 6

export function OTPField({ form, onOTP }: OTPFieldProps) {
  useEffect(() => {
    const otpInput = document.querySelector('.otp-input');
    if (otpInput) {
      (otpInput as HTMLInputElement).focus();
    }
  }, []);

  return (
    <div className="w-full flex justify-center">
      <FormField
        control={form.control}
        name="otp"
        render={({ field }) => (
        <FormItem>
          <FormControl>
            <OtpStyledInput
              numInputs={OTP_LENGTH}
              value={field.value}
              onChange={otp => {
                field.onChange(otp)
                if (otp.length === OTP_LENGTH) {
                  onOTP(otp)
                }
              }}
              className="otp-input"
            />
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
        )}
      />
    </div>
  )
}
