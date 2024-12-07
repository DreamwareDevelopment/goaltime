import { UseFormReturn } from "react-hook-form";
import { Label } from "@/ui-components/label";
import { Button } from "@/ui-components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui-components/tooltip'
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { GoalInput } from "@/shared/zod";

export type TimeSlot = 'Early Morning' | 'Morning' | 'Midday' | 'Afternoon' | 'Evening' | 'Night'

const timeSlots: { [key in TimeSlot]: string } = {
  'Early Morning': '5-8AM',
  'Morning': '8-11AM',
  'Midday': '11AM-2PM',
  'Afternoon': '2-5PM',
  'Evening': '5-8PM',
  'Night': '8-11PM',
}

interface PreferredTimesProps {
  form: UseFormReturn<GoalInput>;
}

export const PreferredTimes = ({ form }: PreferredTimesProps) => {
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