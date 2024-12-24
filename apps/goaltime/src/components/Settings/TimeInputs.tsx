import { Button } from "@/ui-components/button";
import { DatetimePicker } from "@/ui-components/datetime-picker"
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/ui-components/form"
import { Label } from "@/ui-components/label"
import { Input } from "@/ui-components/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui-components/tooltip'

import { FormInputProps } from "./Inputs.tsx"

export const DeadlineInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="deadline"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 items-center sm:items-start">
          <Label className="sm:ml-2">
            Deadline
          </Label>
          <FormControl>
            <DatetimePicker
              {...field}
              format={[
                ["months", "days", "years"],
                []
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}

export const MinimumTimeInput: React.FC<FormInputProps> = ({ form }) => {
  const value = form.watch("minimumTime")
  const date = new Date()
  date.setHours(0, value, 0, 0)
  return (
    <FormField
      control={form.control}
      name="minimumTime"
      render={({ field }) => (
        <FormItem>
          <Label className="pl-2">Minimum Time</Label>
          <FormDescription className="pl-2">
            The minimum amount of time you need to have a productive session.
          </FormDescription>
          <FormControl>
            <DatetimePicker
              {...field}
              dtOptions={{
                hour12: false,
              }}
              format={[
                [],
                ["hours", "minutes"],
              ]}
              value={date}
              onChange={e => {
                if (e) {
                  field.onChange(e.getHours() * 60 + e.getMinutes())
                }
              }}
            />
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}

export const MaximumTimeInput: React.FC<FormInputProps> = ({ form }) => {
  const value = form.watch("maximumTime")
  const date = new Date()
  date.setHours(0, value, 0, 0)
  return (
    <FormField
      control={form.control}
      name="maximumTime"
      render={({ field }) => (
        <FormItem>
          <Label className="pl-2">Maximum Time</Label>
          <FormDescription className="pl-2">
            The maximum amount of time you&apos;d like to spend in a single session.
          </FormDescription>
          <FormControl>
            <DatetimePicker
              {...field}
              format={[
                [],
                ["hours", "minutes"],
              ]}
              dtOptions={{
                hour12: false,
              }}
              value={date}
              onChange={e => {
                if (e) {
                  field.onChange(e.getHours() * 60 + e.getMinutes())
                }
              }}
            />
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}

export type TimeSlot = 'Early Morning' | 'Morning' | 'Midday' | 'Afternoon' | 'Evening' | 'Night'

const timeSlots: { [key in TimeSlot]: string } = {
  'Early Morning': '5-8AM',
  'Morning': '8-11AM',
  'Midday': '11AM-2PM',
  'Afternoon': '2-5PM',
  'Evening': '5-8PM',
  'Night': '8-11PM',
}

export const PreferredTimes = ({ form }: FormInputProps) => {
  return (
    <FormField
      control={form.control}
      name="preferredTimes"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <Label className="ml-2">Preferred Time Slots</Label>
          <FormControl>
            <div className="flex flex-wrap gap-2">
              {Object.entries(timeSlots).map(([slot, time]) => {
                const timeSlot = slot as TimeSlot;
                const isSelected = field.value?.includes(timeSlot) ?? false;

                return (
                  <TooltipProvider key={slot}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const newPreferredTimes = isSelected
                              ? field.value.filter((t: TimeSlot) => t !== timeSlot)
                              : [...(field.value || []), timeSlot];
                            field.onChange(newPreferredTimes);
                          }}
                        >
                          {slot}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{time}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}

export const CommitmentInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="commitment"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 items-center sm:items-start mt-2">
          <Label className="pl-1 text-nowrap" htmlFor="commitment">Weekly Commitment</Label>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter..."
                className="pr-10 w-[200px]"
                type="number"
                min={1}
                max={100}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}

export const EstimateInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="estimate"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 items-center sm:items-start">
          <Label className="ml-2 text-nowrap" htmlFor="estimate">Estimate</Label>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter..."
                className="pr-10 w-[200px]"
                type="number"
                min={1}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}
