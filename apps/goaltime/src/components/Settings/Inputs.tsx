import { UseFormReturn } from "react-hook-form";

import { AutosizeTextarea } from "@/ui-components/text-area";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { GoalInput } from "@/shared/zod";

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
              className="w-full"
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
        <FormItem>
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
