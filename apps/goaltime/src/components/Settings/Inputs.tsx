import { UseFormReturn } from "react-hook-form";

import { AutosizeTextarea } from "@/ui-components/text-area";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { Input } from "@/ui-components/input";
import { Label } from "@/ui-components/label";
import { GoalInput } from "@/shared/zod";
import { DatetimePicker } from "@/ui-components/datetime-picker";


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

export const CommitmentInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="commitment"
      render={({ field }) => (
        <FormItem className="space-y-2 w-[200px] mt-2">
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
                value={field.value ?? ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="ml-2 text-center" />
        </FormItem>
      )}
    />
  )
}

export const EstimateInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="estimate"
      render={({ field }) => (
        <FormItem className="space-y-2 w-[200px]">
          <Label className="ml-2 text-nowrap" htmlFor="estimate">Estimate</Label>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter..."
                className="pr-10"
                type="number"
                min={1}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="ml-2 text-center" />
        </FormItem>
      )}
    />
  )
}

export const DeadlineInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="deadline"
      render={({ field }) => (
        <FormItem>
          <Label className="pl-2">
            Deadline
          </Label>
          <FormControl>
            <DatetimePicker
              {...field}
              format={[
                ["months", "days", "years"],
                []
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage className="pl-2 text-center" />
        </FormItem>
      )}
    />
  )
}
