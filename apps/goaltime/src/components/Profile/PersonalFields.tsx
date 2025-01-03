import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form"
import { FloatingLabelInput } from "@/ui-components/floating-input"
import { DatetimePicker } from "@/ui-components/datetime-picker"
import { UserProfileInput } from "@/shared/zod"
import { UseFormReturn } from "react-hook-form"
import { TimezoneField } from "./TimezoneField"
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from "@/libs/ui-components/src/components/ui/select"

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
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-4 sm:gap-16 mb-4">
        <FormField
          control={form.control}
          name="preferredLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-2">
                Preferred Language
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-2">
                Preferred Currency
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
