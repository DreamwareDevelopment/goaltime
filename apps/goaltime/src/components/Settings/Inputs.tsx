import { UseFormReturn } from "react-hook-form";

import { AutosizeTextarea } from "@/ui-components/text-area";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { GoalInput } from "@/shared/zod";
import { Checkbox } from "@/ui-components/checkbox";
import { Label } from "@/ui-components/label";

export interface FormInputProps {
  form: UseFormReturn<GoalInput>;
}

export const TitleInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem className="flex flex-col items-start">
          <FormControl>
            <FloatingLabelInput
              label="Title"
              className="w-full mt-1"
              {...field}
            />
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}

export const DescriptionInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className="mt-4">
          <FormControl>
            <AutosizeTextarea
              id="description"
              name="description"
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Description (optional)"
            />
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}

export const BreakRemindersCheckbox: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="breakReminders"
      render={({ field }) => (
        <FormItem className="flex gap-4 h-6 pl-2 items-center">
          <Label>Break Reminders</Label>
          <FormControl>
            <Checkbox
              id="breakReminders"
              style={{ marginTop: '2px' }}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export const CanDoDuringWorkCheckbox: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="canDoDuringWork"
      render={({ field }) => (
        <FormItem className="flex gap-4 h-6 pl-2 items-center">
          <Label>Can Do During Work</Label>
          <FormControl>
            <Checkbox
              id="canDoDuringWork"
              style={{ marginTop: '2px' }}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export const AllowMultiplePerDayCheckbox: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="allowMultiplePerDay"
      render={({ field }) => (
        <FormItem className="flex gap-4 h-6 pl-2 items-center">
          <Label>Allow Multiple Per Day</Label>
          <FormControl>
            <Checkbox
              id="allowMultiplePerDay"
              style={{ marginTop: '2px' }}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
