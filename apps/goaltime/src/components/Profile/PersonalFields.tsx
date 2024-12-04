import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form"
import { FloatingLabelInput } from "@/ui-components/floating-input"
import { DatetimePicker } from "@/ui-components/datetime-picker"
import { UserProfileInput } from "@/shared/zod"
import { UseFormReturn } from "react-hook-form"
import { TimezoneField } from "./TimezoneField"

export function PersonalFields({ form }: { form: UseFormReturn<UserProfileInput> }) {
  return (
    <div className="flex flex-wrap gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="pt-[51px] min-w-[307px] flex-1">
            <FormControl>
              <FloatingLabelInput
                type="text"
                autoComplete="name"
                label="Name"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage className="pl-2" />
          </FormItem>
        )}
      />
      <div className="flex flex-wrap gap-4">
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-2">
                Birthday
                <span className="text-xs text-muted-foreground">
                  &nbsp;&nbsp;(optional)
                </span>
              </FormLabel>
              <FormControl>
                <DatetimePicker
                  value={field.value}
                  onChange={field.onChange}
                  format={[
                    ["months", "days", "years"],
                    []
                  ]}
                />
              </FormControl>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
        <TimezoneField form={form} className="flex-1" />
      </div>
    </div>
  )
}
