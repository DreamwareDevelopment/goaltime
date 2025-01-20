import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form";
import { dayjs } from '@/shared/utils'
import { DatetimePicker } from "@/ui-components/datetime-picker";
import { DaysSelectionEnum, DaysSelectionEnumType, RoutineActivity, UserProfileInput } from "@/shared/zod";
import { CircularTabsTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";
import { UseFormReturn } from "react-hook-form";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/ui-components/accordion";
import { Checkbox } from "@/ui-components/checkbox";

export interface RoutineFieldsContainerProps {
  defaultOpen: 'Everyday' | 'Weekly' | 'Custom'
  form: UseFormReturn<UserProfileInput>
}

interface DaysSelectorProps {
  activity: RoutineActivity
  defaultOpen: 'Everyday' | 'Weekly' | 'Custom'
  form: UseFormReturn<UserProfileInput>
  setOpen: (open: 'sleep' | 'lunch' | 'dinner') => void
}

interface RoutineFieldsProps {
  activity: RoutineActivity
  form: UseFormReturn<UserProfileInput>
  days: DaysSelectionEnumType
  onChange?: (field: 'start' | 'end' | 'skip', date: Date | boolean) => void
  setOpen: (open: 'sleep' | 'lunch' | 'dinner') => void
}


function RoutineFields({ form, days, activity, onChange, setOpen }: RoutineFieldsProps) {
  const timezone = form.watch('timezone')
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <FormField
          control={form.control}
          name={activity === 'sleep' ? `routine.sleep.${days}.end` : `routine.${activity}.${days}.start`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-1">
                { activity === 'sleep' ? 'Wake Up' : activity.charAt(0).toUpperCase() + activity.slice(1) + ' Start' }
              </FormLabel>
              <FormControl>
                <DatetimePicker
                  {...field}
                  format={[
                    [],
                    ["hours", "minutes", "am/pm"]
                  ]}
                  value={activity !== 'sleep' && form.watch(`routine.${activity}.${days}.skip`) ? null : field.value}
                  onChange={(e) => {
                    const newDate = dayjs.tz(e, timezone).toDate()
                    field.onChange(newDate)
                    onChange?.(activity === 'sleep' ? 'end' : 'start', newDate)
                  }}
                />
              </FormControl>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={activity === 'sleep' ? `routine.sleep.${days}.start` : `routine.${activity}.${days}.end`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="pl-1">
                { activity === 'sleep' ? 'Sleep At' : activity.charAt(0).toUpperCase() + activity.slice(1) + ' End' }
              </FormLabel>
              <FormControl>
                <DatetimePicker
                  {...field}
                  format={[
                    [],
                    ["hours", "minutes", "am/pm"]
                  ]}
                  value={activity !== 'sleep' && form.watch(`routine.${activity}.${days}.skip`) ? null : field.value}
                  onChange={(e) => {
                    const newDate = dayjs.tz(e, timezone).toDate()
                    field.onChange(newDate)
                    onChange?.(activity === 'sleep' ? 'start' : 'end', newDate)
                  }}
                />
              </FormControl>
              <FormMessage className="pl-2" />
            </FormItem>
          )}
        />
      </div>
      { activity !== 'sleep' && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <FormField
            control={form.control}
            name={`routine.${activity}.${days}.skip`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <FormLabel>
                      Skip {activity.charAt(0).toUpperCase() + activity.slice(1)}
                    </FormLabel>
                    <Checkbox checked={field.value} onCheckedChange={checked => {
                      field.onChange(Boolean(checked))
                      onChange?.('skip', Boolean(checked))
                      if (checked) {
                        form.setValue(`routine.${activity}.${days}.start`, null)
                        form.setValue(`routine.${activity}.${days}.end`, null)
                        setOpen(activity === 'breakfast' ? 'lunch' : activity === 'lunch' ? 'dinner' : 'sleep')
                      }
                    }}/>
                  </div>
                </FormControl>
                <FormMessage className="pl-2" />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )
}

export function DaysSelector({ defaultOpen, form, activity, setOpen }: DaysSelectorProps) {
  return (
    <Tabs defaultValue={defaultOpen} className="flex flex-col gap-2 justify-center items-center w-full">
      <TabsList>
        <TabsTrigger value={DaysSelectionEnum.Enum.Everyday}>Everyday</TabsTrigger>
        <TabsTrigger value="Weekly">Weekly</TabsTrigger>
        <TabsTrigger value="Custom">Custom</TabsTrigger>
      </TabsList>
      <TabsContent value="Everyday" className="w-full">
        <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Everyday} onChange={(field, date) => {
          const fieldKey = field as 'start' | 'end'; // Could also be 'skip' but types are difficult here.
          for (const day of Object.values(DaysSelectionEnum.Values)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setValue(`routine.${activity}.${day}.${fieldKey}`, date as any)
          }
        }} setOpen={setOpen} />
      </TabsContent>
      <TabsContent value="Weekly" className="w-full">
        <Tabs defaultValue={DaysSelectionEnum.Enum.Weekdays} className="flex flex-col gap-2 justify-center items-center w-full">
          <TabsList>
            <TabsTrigger value={DaysSelectionEnum.Enum.Weekdays}>Weekdays</TabsTrigger>
            <TabsTrigger value={DaysSelectionEnum.Enum.Weekends}>Weekends</TabsTrigger>
          </TabsList>
          <TabsContent value={DaysSelectionEnum.Enum.Weekdays} className="w-full">
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Weekdays} onChange={(field, date) => {
              const fieldKey = field as 'start' | 'end'; // Could also be 'skip' but types are difficult here.
              for (const day of [DaysSelectionEnum.Enum.Monday, DaysSelectionEnum.Enum.Tuesday, DaysSelectionEnum.Enum.Wednesday, DaysSelectionEnum.Enum.Thursday, DaysSelectionEnum.Enum.Friday]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                form.setValue(`routine.${activity}.${day}.${fieldKey}`, date as any)
              }
            }} setOpen={setOpen} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Weekends} className="w-full">
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Weekends} onChange={(field, date) => {
              const fieldKey = field as 'start' | 'end'; // Could also be 'skip' but types are difficult here.
              for (const day of [DaysSelectionEnum.Enum.Saturday, DaysSelectionEnum.Enum.Sunday]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                form.setValue(`routine.${activity}.${day}.${fieldKey}`, date as any)
              }
            }} setOpen={setOpen} />
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
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Sunday} setOpen={setOpen}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Monday} className="w-full" >
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Monday} setOpen={setOpen}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Tuesday} className="w-full">
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Tuesday} setOpen={setOpen}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Wednesday} className="w-full"  >
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Wednesday} setOpen={setOpen}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Thursday} className="w-full">
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Thursday} setOpen={setOpen}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Friday} className="w-full">
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Friday} setOpen={setOpen}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Saturday} className="w-full">
            <RoutineFields form={form} activity={activity} days={DaysSelectionEnum.Enum.Saturday} setOpen={setOpen}/>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  )
}

export function RoutineFieldsContainer({ defaultOpen, form }: RoutineFieldsContainerProps) {
  const [value, setOpen] = useState('sleep')
  return (
    <div>
      <p className="text-xl font-bold text-center">Routine</p>
      <p className="text-xs text-muted-foreground text-center">We won&apos;t schedule activities during these times</p>
      <div className="flex flex-col gap-4 justify-center items-center">
      <Accordion type="single" collapsible defaultValue="sleep" value={value} onValueChange={setOpen} className="w-full h-full">
        <AccordionItem value="sleep" className="w-full">
          <AccordionTrigger className="text-md font-bold">Sleep</AccordionTrigger>
          <AccordionContent className="flex flex-wrap items-center justify-between gap-4">
            <DaysSelector defaultOpen={defaultOpen} form={form} activity="sleep" setOpen={setOpen}/>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="breakfast" className="w-full">
          <AccordionTrigger className="text-md font-bold">Breakfast</AccordionTrigger>
          <AccordionContent className="flex flex-wrap items-center justify-between gap-4">
            <DaysSelector defaultOpen={defaultOpen} form={form} activity="breakfast" setOpen={setOpen}/>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="lunch" className="w-full">
          <AccordionTrigger className="text-md font-bold">Lunch</AccordionTrigger>
          <AccordionContent className="flex flex-wrap items-center justify-between gap-4">
            <DaysSelector defaultOpen={defaultOpen} form={form} activity="lunch" setOpen={setOpen}/>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="dinner" className="w-full border-none">
          <AccordionTrigger className="text-md font-bold">Dinner</AccordionTrigger>
          <AccordionContent className="flex flex-wrap items-center justify-between gap-4">
            <DaysSelector defaultOpen={defaultOpen} form={form} activity="dinner" setOpen={setOpen}/>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </div>
  )
}
