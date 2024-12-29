import { CredenzaBody, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle } from "@/libs/ui-components/src/components/ui/credenza";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { DatetimePicker } from "@/ui-components/datetime-picker";
import { dayjs } from "@/shared/utils"
import { ViewEvent } from "../ScheduleCard";
import { Label } from "@/ui-components/label";
import { useState } from "react";
import { LoadingSpinner } from "@/libs/ui-components/src/svgs/spinner";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { useForm, UseFormReturn } from "react-hook-form";
import { CalendarEventInput, CalendarEventSchema, getDefaults } from "@/shared/zod";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { AutosizeTextarea } from "@/ui-components/text-area";

interface EventModalProps extends React.HTMLAttributes<HTMLDivElement> {
  event: ViewEvent;
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

export function EventModal({ event, setOpen, ...props }: EventModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CalendarEventInput>({
    defaultValues: {
      ...getDefaults(CalendarEventSchema),
      ...event,
      startTime: dayjs(event.startTime).toDate(),
      endTime: dayjs(event.endTime).toDate(),
    },
  });

  const { formState, handleSubmit } = form
  const { isSubmitting, isValidating } = formState

  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // await updateEvent(event.id, {
    //   startTime: dayjs(start).toISOString(),
    //   endTime: dayjs(end).toISOString(),
    // });
    setIsLoading(false);
    setOpen(false);
  }

  return (
    <CredenzaContent {...props}>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CredenzaHeader className="flex flex-col items-center gap-2 md:py-4 px-4">
            <p className="text-sm text-muted-foreground text-center w-full">Edit single event</p>
            <TitleInput form={form} />
            { form.watch('description') && <DescriptionInput form={form} /> }
          </CredenzaHeader>
          <CredenzaBody className="px-0">
            <div className="flex flex-col gap-4 px-4 pt-0 pb-4">
              <div className="flex flex-wrap justify-between gap-4">
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
                            value={field.value}
                          />
                        </div>
                      </FormControl>
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
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-center">
                <ShinyButton className="w-28" variant="gooeyLeft" disabled={isLoading} type="submit">
                  {isLoading || isValidating || isSubmitting ? <LoadingSpinner /> : "Save"}
                </ShinyButton>
              </div>
            </div>
          </CredenzaBody>
        </form>
      </Form>
    </CredenzaContent>
  )
}
