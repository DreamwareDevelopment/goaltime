import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui-components/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form";
import { dayjs } from '@/shared/utils'
import { DatetimePicker } from "@/ui-components/datetime-picker";
import { UserProfileInput } from "@/shared/zod";
import { UseFormReturn } from "react-hook-form";

export interface PreferencesFieldsProps {
  form: UseFormReturn<UserProfileInput>
}

export function PreferencesFields({ form }: PreferencesFieldsProps) {
  const timezone = form.watch('timezone')
  return (
    <div>
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-4 sm:gap-16">
        <FormField
          control={form.control}
          name="preferredWakeUpTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-2">
                Normal Wake Up Time
              </FormLabel>
              <FormControl>
                <DatetimePicker
                  {...field}
                  format={[
                    [],
                    ["hours", "minutes", "am/pm"]
                  ]}
                  value={field.value}
                  onChange={(e) => field.onChange(dayjs.tz(e, timezone).toDate())}
                />
              </FormControl>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredSleepTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-1">
                Normal Sleep Time
              </FormLabel>
              <FormControl>
                <DatetimePicker
                  {...field}
                  format={[
                    [],
                    ["hours", "minutes", "am/pm"]
                  ]}
                  value={field.value}
                  onChange={(e) => field.onChange(dayjs.tz(e, timezone).toDate())}
                />
              </FormControl>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
