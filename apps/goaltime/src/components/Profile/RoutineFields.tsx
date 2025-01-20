import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui-components/form";
import { dayjs } from '@/shared/utils'
import { DatetimePicker } from "@/ui-components/datetime-picker";
import { DaysSelectionEnum, DaysSelectionEnumType, UserProfileInput } from "@/shared/zod";
import { CircularTabsTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";
import { UseFormReturn } from "react-hook-form";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/ui-components/accordion";
import { Checkbox } from "@/ui-components/checkbox";

export interface RoutineFieldsContainerProps {
  defaultOpen: 'Everyday' | 'Weekly' | 'Custom'
  form: UseFormReturn<UserProfileInput>
}

interface DaysSelectorProps {
  defaultOpen: 'Everyday' | 'Weekly' | 'Custom'
  form: UseFormReturn<UserProfileInput>
}

type RoutineField = 'wakeUpTime' | 'breakfastStart' | 'breakfastEnd' | 'lunchStart' | 'lunchEnd' | 'dinnerStart' | 'dinnerEnd' | 'sleepTime'

interface RoutineFieldsProps {
  form: UseFormReturn<UserProfileInput>
  days: DaysSelectionEnumType
  onChange?: (field: RoutineField, date: Date | boolean) => void
}


function RoutineFields({ form, days, onChange }: RoutineFieldsProps) {
  const timezone = form.watch('timezone')
  const [value, setValue] = useState('sleep')
  return (
    <Accordion type="single" collapsible defaultValue="sleep" value={value} onValueChange={setValue} className="w-full h-full">
      <AccordionItem value="sleep" className="w-full">
        <AccordionTrigger className="text-md font-bold">Sleep</AccordionTrigger>
        <AccordionContent className="flex flex-wrap items-center justify-between gap-4">
          <FormField
            control={form.control}
            name={`routine.${days}.wakeUpTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="pl-2">
                  Wake Up Time
                </FormLabel>
                <FormControl>
                  <DatetimePicker
                    {...field}
                    format={[
                      [],
                      ["hours", "minutes", "am/pm"]
                    ]}
                    value={field.value}
                    onChange={(e) => {
                      const newDate = dayjs.tz(e, timezone).toDate()
                      field.onChange(newDate)
                      onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                    }}
                  />
                </FormControl>
                <FormMessage className="pl-2" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`routine.${days}.sleepTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="pl-1">
                  Sleep Time
                </FormLabel>
                <FormControl>
                  <DatetimePicker
                    {...field}
                    format={[
                      [],
                      ["hours", "minutes", "am/pm"]
                    ]}
                    value={field.value}
                    onChange={(e) => {
                      const newDate = dayjs.tz(e, timezone).toDate()
                      field.onChange(newDate)
                      onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                    }}
                  />
                </FormControl>
                <FormMessage className="pl-2" />
              </FormItem>
            )}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="breakfast">
        <AccordionTrigger className="text-md font-bold">Breakfast</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormField
              control={form.control}
              name={`routine.${days}.breakfastStart`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Breakfast Start Time
                  </FormLabel>
                  <FormControl>
                    <DatetimePicker
                      {...field}
                      format={[
                        [],
                        ["hours", "minutes", "am/pm"]
                      ]}
                      value={form.watch(`routine.${days}.skipBreakfast`) ? null : field.value}
                      onChange={(e) => {
                        const newDate = dayjs.tz(e, timezone).toDate()
                        field.onChange(newDate)
                        onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                      }}
                    />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`routine.${days}.breakfastEnd`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Breakfast End Time
                  </FormLabel>
                  <FormControl>
                    <DatetimePicker
                      {...field}
                      format={[
                        [],
                        ["hours", "minutes", "am/pm"]
                      ]}
                      value={form.watch(`routine.${days}.skipBreakfast`) ? null : field.value}
                      onChange={(e) => {
                        const newDate = dayjs.tz(e, timezone).toDate()
                        field.onChange(newDate)
                        onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                      }}
                    />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <FormField
              control={form.control}
              name={`routine.${days}.skipBreakfast`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <FormLabel>
                        Skip Breakfast
                      </FormLabel>
                      <Checkbox checked={field.value} onCheckedChange={checked => {
                        field.onChange(checked)
                        onChange?.('skipBreakfast', checked)
                        if (checked) {
                          form.setValue(`routine.${days}.breakfastStart`, null)
                          form.setValue(`routine.${days}.breakfastEnd`, null)
                          setValue('lunch')
                        }
                      }}/>
                    </div>
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lunch">
        <AccordionTrigger className="text-md font-bold">Lunch</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormField
              control={form.control}
              name={`routine.${days}.lunchStart`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Lunch Start Time
                  </FormLabel>
                  <FormControl>
                    <DatetimePicker
                      {...field}
                      format={[
                        [],
                        ["hours", "minutes", "am/pm"]
                      ]}
                      value={form.watch(`routine.${days}.skipLunch`) ? null : field.value}
                      onChange={(e) => {
                        const newDate = dayjs.tz(e, timezone).toDate()
                        field.onChange(newDate)
                        onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                      }}
                    />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`routine.${days}.lunchEnd`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Lunch End Time
                  </FormLabel>
                  <FormControl>
                    <DatetimePicker
                      {...field}
                      format={[
                        [],
                        ["hours", "minutes", "am/pm"]
                      ]}
                      value={form.watch(`routine.${days}.skipLunch`) ? null : field.value}
                      onChange={(e) => {
                        const newDate = dayjs.tz(e, timezone).toDate()
                        field.onChange(newDate)
                        onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                      }}
                    />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <FormField
              control={form.control}
              name={`routine.${days}.skipLunch`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <FormLabel>
                        Skip Lunch
                      </FormLabel>
                      <Checkbox checked={field.value} onCheckedChange={checked => {
                        field.onChange(checked)
                        onChange?.('skipLunch', checked)
                        if (checked) {
                          form.setValue(`routine.${days}.lunchStart`, null)
                          form.setValue(`routine.${days}.lunchEnd`, null)
                          setValue('dinner')
                        }
                      }}/>
                    </div>
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="dinner" className="border-none">
        <AccordionTrigger className="text-md font-bold">Dinner</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormField
              control={form.control}
              name={`routine.${days}.dinnerStart`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Dinner Start Time
                  </FormLabel>
                  <FormControl>
                    <DatetimePicker
                      {...field}
                      format={[
                        [],
                        ["hours", "minutes", "am/pm"]
                      ]}
                      value={form.watch(`routine.${days}.skipDinner`) ? null : field.value}
                      onChange={(e) => {
                        const newDate = dayjs.tz(e, timezone).toDate()
                        field.onChange(newDate)
                        onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                      }}
                    />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`routine.${days}.dinnerEnd`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pl-1">
                    Dinner End Time
                  </FormLabel>
                  <FormControl>
                    <DatetimePicker
                      {...field}
                      format={[
                        [],
                        ["hours", "minutes", "am/pm"]
                      ]}
                      value={form.watch(`routine.${days}.skipDinner`) ? null : field.value}
                      onChange={(e) => {
                        const newDate = dayjs.tz(e, timezone).toDate()
                        field.onChange(newDate)
                        onChange?.(field.name.split('.').pop() as RoutineField, newDate)
                      }}
                    />
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <FormField
              control={form.control}
              name={`routine.${days}.skipDinner`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <FormLabel>
                        Skip Dinner
                      </FormLabel>
                      <Checkbox checked={field.value} onCheckedChange={checked => {
                        field.onChange(checked)
                        onChange?.('skipDinner', checked)
                        if (checked) {
                          form.setValue(`routine.${days}.dinnerStart`, null)
                          form.setValue(`routine.${days}.dinnerEnd`, null)
                          setValue('sleep')
                        }
                      }}/>
                    </div>
                  </FormControl>
                  <FormMessage className="pl-2" />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function DaysSelector({ defaultOpen, form }: DaysSelectorProps) {
  return (
    <Tabs defaultValue={defaultOpen} className="flex flex-col gap-2 justify-center items-center w-full">
      <TabsList>
        <TabsTrigger value={DaysSelectionEnum.Enum.Everyday}>Everyday</TabsTrigger>
        <TabsTrigger value="Weekly">Weekly</TabsTrigger>
        <TabsTrigger value="Custom">Custom</TabsTrigger>
      </TabsList>
      <TabsContent value="Everyday" className="w-full">
        <RoutineFields form={form} days={DaysSelectionEnum.Enum.Everyday} onChange={(field, date) => {
          for (const day of Object.values(DaysSelectionEnum.Values)) {
            form.setValue(`routine.${day}.${field}`, date)
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
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Weekdays} onChange={(field, date) => {
              for (const day of [DaysSelectionEnum.Enum.Monday, DaysSelectionEnum.Enum.Tuesday, DaysSelectionEnum.Enum.Wednesday, DaysSelectionEnum.Enum.Thursday, DaysSelectionEnum.Enum.Friday]) {
                form.setValue(`routine.${day}.${field}`, date)
              }
            }} />
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Weekends} className="w-full">
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Weekends} onChange={(field, date) => {
              for (const day of [DaysSelectionEnum.Enum.Saturday, DaysSelectionEnum.Enum.Sunday]) {
                form.setValue(`routine.${day}.${field}`, date)
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
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Sunday}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Monday} className="w-full" >
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Monday}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Tuesday} className="w-full">
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Tuesday}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Wednesday} className="w-full"  >
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Wednesday}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Thursday} className="w-full">
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Thursday}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Friday} className="w-full">
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Friday}/>
          </TabsContent>
          <TabsContent value={DaysSelectionEnum.Enum.Saturday} className="w-full">
            <RoutineFields form={form} days={DaysSelectionEnum.Enum.Saturday}/>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  )
}

export function RoutineFieldsContainer({ defaultOpen, form }: RoutineFieldsContainerProps) {return (
    <div>
      <div className="flex flex-col gap-4 justify-center items-center">
        <DaysSelector defaultOpen={defaultOpen} form={form}/>
      </div>
    </div>
  )
}
