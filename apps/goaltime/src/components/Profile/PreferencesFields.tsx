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
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-around items-center gap-4">
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
