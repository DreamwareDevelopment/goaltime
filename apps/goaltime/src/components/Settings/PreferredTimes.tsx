import { FormMessage } from "@/libs/ui-components/src/components/ui/form";
import { FormField } from "@/libs/ui-components/src/components/ui/form";
import { FormItem } from "@/libs/ui-components/src/components/ui/form";
import { Label } from "@/libs/ui-components/src/components/ui/label";
import { Button } from "@/libs/ui-components/src/components/ui/button";
import { FormControl } from "@/libs/ui-components/src/components/ui/form";
import { Tooltip, TooltipTrigger, TooltipProvider, TooltipContent } from "@/ui-components/tooltip";
import { UseFormReturn } from "react-hook-form";
import { GoalInput, PreferredTimesEnumType } from "@/libs/shared/src/lib/schemas/goals";
import { DaysSelectionEnum, DaysSelectionEnumType } from "@/libs/shared/src/lib/schemas";
import { Tabs, TabsList, TabsTrigger, TabsContent, CircularTabsTrigger } from "@/ui-components/tabs";

// TODO: Make this dynamic based on user's sleep schedule
const timeSlots: { [key in PreferredTimesEnumType]: string } = {
  'Early Morning': '5-8AM',
  'Morning': '8-11AM',
  'Midday': '11AM-2PM',
  'Afternoon': '2-5PM',
  'Evening': '5-8PM',
  'Night': '8-11PM',
  'Late Night': '11PM-2AM',
}

interface PreferredTimesProps {
  day: DaysSelectionEnumType;
  form: UseFormReturn<GoalInput>;
  onChange?: (preferredTimes: PreferredTimesEnumType[]) => void;
}

export const PreferredTimes = ({ day, form, onChange }: PreferredTimesProps) => {
  return (
    <FormField
      control={form.control}
      name={`preferredTimes.${day}`}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormControl>
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {Object.entries(timeSlots).map(([slot, time]) => {
                const timeSlot = slot as PreferredTimesEnumType;
                const isSelected = field.value?.includes(timeSlot) ?? false;

                return (
                  <TooltipProvider key={slot}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "secondary"}
                          size="sm"
                          onClick={() => {
                            const newPreferredTimes = isSelected
                              ? field.value?.filter((t: PreferredTimesEnumType) => t !== timeSlot) || []
                              : [...(field.value || []), timeSlot];
                            field.onChange(newPreferredTimes);
                            onChange?.(newPreferredTimes);
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

interface PreferredTimesSelectorProps {
  defaultOpen: 'Everyday' | 'Weekly' | 'Custom'
  form: UseFormReturn<GoalInput>
}

export function PreferredTimesSelector({ defaultOpen, form }: PreferredTimesSelectorProps) {
  return (
    <Tabs defaultValue={defaultOpen} className="flex flex-col gap-2 justify-center items-center w-full border rounded-md p-4">
      <Label className="text-center mb-2">Preferred Time Slots</Label>
      <TabsList>
        <TabsTrigger value={DaysSelectionEnum.Enum.Everyday}>Everyday</TabsTrigger>
        <TabsTrigger value="Weekly">Weekly</TabsTrigger>
        <TabsTrigger value="Custom">Custom</TabsTrigger>
      </TabsList>
      <TabsContent value="Everyday" className="w-full">
        <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Everyday} onChange={(newValues) => {
          for (const day of Object.values(DaysSelectionEnum.Values)) {
            form.setValue(`preferredTimes.${day}`, newValues);
          }
        }} />
      </TabsContent>
      <TabsContent value="Weekly" className="w-full">
        <Tabs defaultValue={DaysSelectionEnum.Enum.Weekdays} className="flex flex-col gap-2 justify-center items-center w-full">
          <TabsList>
            <TabsTrigger value={DaysSelectionEnum.Enum.Weekdays}>Weekdays</TabsTrigger>
            <TabsTrigger value={DaysSelectionEnum.Enum.Weekends}>Weekends</TabsTrigger>
          </TabsList>
          <TabsContent value={DaysSelectionEnum.Enum.Weekdays} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Weekdays} onChange={(newValues) => {
              for (const day of [DaysSelectionEnum.Enum.Monday, DaysSelectionEnum.Enum.Tuesday, DaysSelectionEnum.Enum.Wednesday, DaysSelectionEnum.Enum.Thursday, DaysSelectionEnum.Enum.Friday]) {
                form.setValue(`preferredTimes.${day}`, newValues);
              }
            }} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Weekends} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Weekends} onChange={(newValues) => {
              for (const day of [DaysSelectionEnum.Enum.Saturday, DaysSelectionEnum.Enum.Sunday]) {
                form.setValue(`preferredTimes.${day}`, newValues);
              }
            }} />
          </TabsContent>
        </Tabs>
      </TabsContent>
      <TabsContent value="Custom" className="w-full">
        <Tabs defaultValue={DaysSelectionEnum.Enum.Sunday} className="flex flex-col gap-2 justify-center items-center w-full">
          <TabsList>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Sunday}>S</CircularTabsTrigger>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Monday}>M</CircularTabsTrigger>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Tuesday}>T</CircularTabsTrigger>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Wednesday}>W</CircularTabsTrigger>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Thursday}>Th</CircularTabsTrigger>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Friday}>F</CircularTabsTrigger>
            <CircularTabsTrigger value={DaysSelectionEnum.Enum.Saturday}>S</CircularTabsTrigger>
          </TabsList>
          <TabsContent value={DaysSelectionEnum.Enum.Sunday} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Sunday} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Monday} className="w-full" >
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Monday} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Tuesday} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Tuesday} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Wednesday} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Wednesday} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Thursday} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Thursday} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Friday} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Friday} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Saturday} className="w-full">
            <PreferredTimes form={form} day={DaysSelectionEnum.Enum.Saturday} />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  )
}