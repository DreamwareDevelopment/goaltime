import { UseFormReturn } from "react-hook-form";

import { AutosizeTextarea } from "@/ui-components/text-area";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { Input } from "@/ui-components/input";
import { Label } from "@/ui-components/label";
import { GoalInput } from "@/shared/zod";


export interface TitleInputProps {
  form: UseFormReturn<GoalInput>;
}

export const TitleInput: React.FC<TitleInputProps> = ({ form }) => {
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

export interface DescriptionInputProps {
  form: UseFormReturn<GoalInput>;
}

export const DescriptionInput: React.FC<DescriptionInputProps> = ({ form }) => {
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

export interface CommitmentInputProps {
  form: UseFormReturn<GoalInput>;
}

export const CommitmentInput: React.FC<CommitmentInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="commitment"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <Label className="ml-2 text-nowrap" htmlFor="commitment">Weekly Commitment</Label>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter..."
                className="pr-10"
                type="number"
                min={1}
                max={100}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}
