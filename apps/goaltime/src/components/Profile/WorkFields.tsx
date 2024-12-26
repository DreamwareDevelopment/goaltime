import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/ui-components/form"
import { FloatingLabelInput } from "@/ui-components/floating-input"
import { UseFormReturn } from "react-hook-form"
import { daysOfTheWeek, UserProfileInput } from "@/shared/zod"
import { Checkbox } from "@/ui-components/checkbox"
import { MultiSelect, Option } from "@/ui-components/multi-select"
import { dayjs } from '@/shared/utils'
import { DatetimePicker } from "@/libs/ui-components/src/components/ui/datetime-picker"

const daysOfTheWeekOptions: Option[] = Object.values(daysOfTheWeek.Values).map(day => ({ label: day, value: day }))

export interface WorkFieldsProps {
  form: UseFormReturn<UserProfileInput>
}

export function WorkFields({ form }: WorkFieldsProps) {
  const timezone = form.watch('timezone')
  const handleWorkDaysChange = (value: Option[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue('workDays', value.map(option => option.value) as any)
  }
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="occupation"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <FloatingLabelInput
                type="text"
                autoComplete="occupation"
                label="Occupation  (optional)"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage className="pl-2" />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="unemployed"
        render={({ field }) => (
          <FormItem className="flex items-center">
            <FormLabel className="pl-2">
              Unemployed
            </FormLabel>
            <FormControl>
              <Checkbox
                className="ml-2"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormMessage className="pl-2" />
          </FormItem>
        )}
      />
      {!form.watch('unemployed') && (
        <>
          <FormField
            control={form.control}
            name="workDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="pl-2">
                  Work Days
                </FormLabel>
                <FormControl>
                  <MultiSelect
                    options={daysOfTheWeekOptions}
                    onChange={handleWorkDaysChange}
                    value={field.value?.map(day => ({ label: day, value: day }))}
                  />
                </FormControl>
                <FormMessage className="pl-2" />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="startsWorkAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-2">
                    Starts Work At
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
              name="endsWorkAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Ends Work At
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
        </>
      )}
    </div>
  )
}
