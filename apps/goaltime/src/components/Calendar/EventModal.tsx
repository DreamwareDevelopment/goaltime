import { CredenzaBody, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle } from "@/libs/ui-components/src/components/ui/credenza";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { DatetimePicker } from "@/ui-components/datetime-picker";
import { dayjs } from "@/shared/utils"
import { Label } from "@/ui-components/label";
import { LoadingSpinner } from "@/libs/ui-components/src/svgs/spinner";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { FieldErrors, useForm, UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui-components/select";
import { CalendarEventInput, CalendarEventSchema, getDefaults, getZodResolver } from "@/shared/zod";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { AutosizeTextarea } from "@/ui-components/text-area";
import { useValtio } from "../data/valtio";
import { CalendarEvent, Goal } from "@prisma/client";
import { toast } from "@/libs/ui-components/src/hooks/use-toast";
import { useSnapshot } from "valtio";
import { useEffect } from "react";
import { cn } from "@/libs/ui-components/src/utils";

interface EventModalProps extends React.HTMLAttributes<HTMLDivElement> {
  event: CalendarEvent | null;
  date?: dayjs.Dayjs;
  isEditable: boolean;
  is24Hour: boolean;
  userId: string;
  timezone: string;
  setOpen: (open: boolean) => void;
}

const TitleInput: React.FC<{ form: UseFormReturn<CalendarEventInput> }> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem className="flex flex-col items-start w-full">
          <FormControl>
            <>
              <CredenzaTitle className="sr-only">
                {field.value}
              </CredenzaTitle>
              <FloatingLabelInput
                label="Title"
                className="w-full"
                {...field}
              />
            </>
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}

const GoalSelect: React.FC<{ goals: ReadonlyArray<Goal>, form: UseFormReturn<CalendarEventInput> }> = ({ goals, form }) => {
  return (
    <FormField
      control={form.control}
      name="goalId"
      render={({ field }) => {
        const selectedGoal = goals.find(goal => goal.id === field.value)
        return (
          <Select value={field.value ?? undefined} onValueChange={field.onChange}>
            <SelectTrigger style={{ backgroundColor: selectedGoal?.color }} className="w-full mt-2 text-white">
              <SelectValue placeholder="Select a goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map(goal => (
                <SelectItem key={goal.id} value={goal.id} style={{ backgroundColor: goal.color }} className="text-white">{goal.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }}
    />
  )
}

const DescriptionInput: React.FC<{ form: UseFormReturn<CalendarEventInput> }> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex flex-col items-center w-full">
          <FormControl>
            <>
              <CredenzaDescription className="sr-only">
                {field.value}
              </CredenzaDescription>
              <AutosizeTextarea
                id="description"
                name="description"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Description (optional)"
                className="w-full"
              />
            </>
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}

export function EventModal({
  event,
  date,
  isEditable,
  is24Hour,
  userId,
  timezone,
  setOpen,
  ...props
}: EventModalProps) {
  const { calendarStore, goalStore } = useValtio()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const goals = useSnapshot(goalStore.goals!)

  const defaultValues = event ? {
    ...getDefaults(CalendarEventSchema),
    ...event,
    userId,
    timezone,
    startTime: dayjs(event.startTime).toDate(),
    endTime: dayjs(event.endTime).toDate(),
  } : getDefaults(CalendarEventSchema, { goalId: goals[0].id, color: goals[0].color, userId, timezone });
  const form = useForm<CalendarEventInput>({
    defaultValues,
    resolver: getZodResolver(CalendarEventSchema, async (data) => {
      const errors: FieldErrors<CalendarEventInput> = {}
      if (data.startTime && data.endTime && dayjs(data.endTime).isBefore(dayjs(data.startTime))) {
        errors.endTime = {
          type: 'validate',
          message: 'End time must be after start time',
        }
      }
      return errors;
    }),
  });

  const { formState, handleSubmit } = form
  const { isSubmitting, isValidating } = formState
  useEffect(() => {
    if (!event) {
      form.setValue('startTime', (date ?? dayjs()).toDate());
      form.setValue('endTime', (date ?? dayjs()).add(1, 'hour').toDate());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async () => {
    // This is intentionally closing the modal before the update to avoid the update
    // rerendering the open animation. It's instant so it's fine.
    setOpen(false);
    try {
      if (event) {
        await calendarStore.updateCalendarEvent(event, form.getValues());
        toast({
          title: 'Event updated',
          description: 'Your event has been updated.',
        });
      } else {
        await calendarStore.createCalendarEvent(form.getValues());
        toast({
          title: 'Event created',
          description: 'Your event has been created.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error updating event',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  }

  const handleDelete = async () => {
    setOpen(false);
    if (!event) {
      throw new Error('Event not found to delete');
    }
    try {
      await calendarStore.deleteCalendarEvent(event);
      toast({
        title: 'Event deleted',
        description: 'Your event has been deleted.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting event',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  }

  if (!isEditable && event) {
    return (
      <CredenzaContent {...props}>
        <CredenzaDescription className="text-right pr-4">
          <span className="font-bold capitalize">{event.provider}</span> event
        </CredenzaDescription>
        <CredenzaHeader className="flex flex-col items-start gap-2 md:py-4 px-4">
          <CredenzaTitle>{event.title}</CredenzaTitle>
          { event.description && <p className="text-md text-muted-foreground">{event.description}</p> }
        </CredenzaHeader>
        <CredenzaBody className="px-0">
          <div className="flex flex-col gap-4 px-4 pt-0 pb-4">
            <p className="text-md text-muted-foreground">
              {dayjs(event.startTime).format(is24Hour ? 'HH:mm' : 'h:mm A')} - {dayjs(event.endTime).format(is24Hour ? 'HH:mm' : 'h:mm A')}
            </p>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    )
  }

  return (
    <CredenzaContent {...props}>
      <CredenzaDescription className="sr-only">
        {event ? 'Edit single event' : 'Create event'}
      </CredenzaDescription>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CredenzaHeader className="flex flex-col items-center gap-2 md:py-4 px-4">
            <p className="text-md font-semibold text-foreground text-center w-full">{ event ? 'Edit single event' : 'Create event' }</p>
            <TitleInput form={form} />
            { (form.watch('description') || !event) && <DescriptionInput form={form} /> }
            <GoalSelect goals={goals} form={form} />
          </CredenzaHeader>
          <CredenzaBody className="px-0">
            <div className="flex flex-col gap-4 px-4 pt-0 pb-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="pl-2">Start</Label>
                          <DatetimePicker
                            format={[
                              event ? [] : ["years", "months", "days"],
                              ["hours", "minutes", "am/pm"]
                            ]}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="pl-2">End</Label>
                          <DatetimePicker
                            format={[
                              event ? [] : ["years", "months", "days"],
                              ["hours", "minutes", "am/pm"]
                            ]}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />
              </div>
              <div className={cn(
                "flex flex-col-reverse sm:flex-row sm:flex-wrap items-center gap-4",
                !event ? 'justify-end' : 'justify-between',
              )}>
                { event && (
                  <ShinyButton variant="outline" onClick={handleDelete} className="w-28 h-[34px] sm:h-[51px] text-destructive bg-destructive/10 hover:bg-destructive/60">
                    Delete Event
                  </ShinyButton>
                )}
                <ShinyButton className="w-28 h-[34px] sm:h-[51px]" variant="gooeyLeft" type="submit">
                  {isValidating || isSubmitting ? <LoadingSpinner /> : "Save"}
                </ShinyButton>
              </div>
            </div>
          </CredenzaBody>
        </form>
      </Form>
    </CredenzaContent>
  )
}
