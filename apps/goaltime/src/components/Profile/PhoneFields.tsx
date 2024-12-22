import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form"
import { OtpStyledInput } from "@/ui-components/otp"
import { PhoneInput } from "@/ui-components/phone-input"

import { UserProfileInput } from "@/shared/zod"
import { UseFormReturn } from "react-hook-form"

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
                onChange={field.onChange}
              />
            </FormControl>
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
            />
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
        )}
      />
    </div>
  )
}
