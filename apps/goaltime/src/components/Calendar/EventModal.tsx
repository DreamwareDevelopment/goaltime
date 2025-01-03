import { CredenzaBody, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle } from "@/libs/ui-components/src/components/ui/credenza";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { DatetimePicker } from "@/ui-components/datetime-picker";
import { dayjs } from "@/shared/utils"
import { Label } from "@/ui-components/label";
import { LoadingSpinner } from "@/libs/ui-components/src/svgs/spinner";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { FieldErrors, useForm, UseFormReturn } from "react-hook-form";
import { CalendarEventInput, CalendarEventSchema, getDefaults, getZodResolver } from "@/shared/zod";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { AutosizeTextarea } from "@/ui-components/text-area";
import { useValtio } from "../data/valtio";
import { CalendarEvent } from "@prisma/client";
import { useToast } from "@/libs/ui-components/src/hooks/use-toast";

interface EventModalProps extends React.HTMLAttributes<HTMLDivElement> {
  event: CalendarEvent;
  isEditable: boolean;
  is24Hour: boolean;
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

export function EventModal({ event, isEditable, is24Hour, setOpen, ...props }: EventModalProps) {
  const { calendarStore } = useValtio()
  const { toast } = useToast();

  const form = useForm<CalendarEventInput>({
    defaultValues: {
      ...getDefaults(CalendarEventSchema),
      ...event,
      startTime: dayjs(event.startTime).toDate(),
      endTime: dayjs(event.endTime).toDate(),
    },
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

  const onSubmit = async () => {
    // This is intentionally closing the modal before the update to avoid the update
    // rerendering the open animation. It's instant so it's fine.
    setOpen(false);
    try {
      await calendarStore.updateCalendarEvent(event, form.getValues());
      toast({
        title: 'Event updated',
        description: 'Your event has been updated.',
      });
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

  if (!isEditable) {
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
        Edit single event
      </CredenzaDescription>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CredenzaHeader className="flex flex-col items-center gap-2 md:py-4 px-4">
            <p className="text-sm text-muted-foreground text-center w-full">Edit single event</p>
            <TitleInput form={form} />
            { form.watch('description') && <DescriptionInput form={form} /> }
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
                              [],
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
                              [],
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
              <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap items-center justify-between gap-4">
                <ShinyButton variant="outline" onClick={handleDelete} className="w-28 h-[34px] sm:h-[51px] text-destructive bg-destructive/10 hover:bg-destructive/20">
                  Delete Event
                </ShinyButton>
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
