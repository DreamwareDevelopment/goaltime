import { HelpCircleIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { GoalInput } from "@/shared/zod";
import { Checkbox } from "@/ui-components/checkbox";
import { Input } from "@/ui-components/input";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { Label } from "@/ui-components/label";
import { AutosizeTextarea } from "@/ui-components/text-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui-components/tooltip";

export interface FormInputProps {
  form: UseFormReturn<GoalInput>;
}

// TODO: Make this generic

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
              placeholder="Why is this important? (optional)"
            />
          </FormControl>
          <FormMessage className="ml-2" />
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
        <FormItem className="flex gap-4 pl-2 items-center">
          <Label>Can Do During Work</Label>
          <FormControl>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                <Checkbox
                    id="canDoDuringWork"
                    style={{ marginTop: '2px' }}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Whether or not this goal can be done during work hours</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export const AllowMultiplePerDayCheckbox: React.FC<FormInputProps> = ({ form }) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <FormField
        control={form.control}
        name="allowMultiplePerDay"
        render={({ field }) => (
          <FormItem className="flex gap-4 h-6 pl-2 items-center">
            <Label>Allow Multiple Per Day</Label>
            <FormControl>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                  <Checkbox
                      id="allowMultiplePerDay"
                      style={{ marginTop: '2px' }}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Whether or not this goal can be done multiple times per day</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormControl>
          </FormItem>
        )}
      />
      { form.watch('allowMultiplePerDay') && (
        <FormField
          control={form.control}
          name="breakDuration"
          render={({ field }) => (
            <div>
              <FormItem className="flex gap-2 space-y-0 items-center">
                <Label>Breaks</Label>
                <FormControl>
                  <>
                    <Input
                      {...field}
                      value={field.value ?? undefined}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                      min={10}
                      max={60 * 12}
                      type="number"
                    />
                    <FormMessage className="ml-2" />
                  </>
                </FormControl>
                <span className="text-sm text-muted-foreground">minutes</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircleIcon className="w-10 h-10 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The minimum duration between sessions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormItem>
            </div>
          )}
        />
      )}
    </div>
  )
}
