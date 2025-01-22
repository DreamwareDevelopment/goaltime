import { HelpCircleIcon } from "lucide-react";

import { DatetimePicker } from "@/ui-components/datetime-picker"
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/ui-components/form"
import { Label } from "@/ui-components/label"
import { Input } from "@/ui-components/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui-components/tooltip'

import { FormInputProps } from "./Inputs.tsx"

export const DeadlineInput: React.FC<FormInputProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="deadline"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 items-center sm:items-start">
          <Label className="sm:ml-2">
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
              onChange={(e) => {
                if (e) {
                  field.onChange(e.getHours() * 60 + e.getMinutes());
                }
              }}
            />
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}

export const MinimumTimeInput: React.FC<FormInputProps> = ({ form }) => {
  const value = form.watch("minimumDuration")
  const date = new Date()
  date.setHours(0, value, 0, 0)
  return (
    <FormField
      control={form.control}
      name="minimumDuration"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <Label className="pl-2">Minimum Duration</Label>
            <FormDescription className="sr-only">
              The minimum amount of time you need to have a productive session.
            </FormDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircleIcon className="w-[20px] h-[20px] text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  The minimum amount of time you need to have a productive session.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FormControl>
            <DatetimePicker
              {...field}
              dtOptions={{
                hour12: false,
              }}
              format={[
                [],
                ["hours", "minutes"],
              ]}
              value={date}
              onChange={e => {
                if (e) {
                  field.onChange(e.getHours() * 60 + e.getMinutes())
                }
              }}
            />
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}

export const MaximumTimeInput: React.FC<FormInputProps> = ({ form }) => {
  const value = form.watch("maximumDuration")
  const date = new Date()
  date.setHours(0, value, 0, 0)
  return (
    <FormField
      control={form.control}
      name="maximumDuration"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 items-center justify-center">
          <div className="flex items-center gap-2">
          <Label className="pl-2">Maximum Time</Label>
            <FormDescription className="sr-only">
              The maximum amount of time you&apos;d like to spend in a single session.
            </FormDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircleIcon className="w-[20px] h-[20px] text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  The maximum amount of time you&apos;d like to spend in a single session.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FormControl>
            <DatetimePicker
              {...field}
              format={[
                [],
                ["hours", "minutes"],
              ]}
              dtOptions={{
                hour12: false,
              }}
              value={date}
              onChange={e => {
                if (e) {
                  field.onChange(e.getHours() * 60 + e.getMinutes())
                }
              }}
            />
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
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
        <FormItem className="flex flex-col gap-1 items-center sm:items-start mt-2">
          <Label className="pl-1 text-nowrap" htmlFor="commitment">Weekly Commitment</Label>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter..."
                className="pr-10 w-[200px]"
                type="number"
                min={1.0}
                step={0.5}
                {...field}
                value={field.value ?? undefined}
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value.trim()).toFixed(2);
                  field.onChange(inputValue === "" ? null : Number(inputValue));
                }}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
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
        <FormItem className="flex flex-col gap-1 items-center sm:items-start">
          <Label className="ml-2 text-nowrap" htmlFor="estimate">Estimate</Label>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter..."
                className="pr-10 w-[200px]"
                type="number"
                min={1.0}
                step={0.5}
                {...field}
                value={field.value ?? undefined}
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value.trim()).toFixed(2);
                  field.onChange(inputValue === "" ? null : Number(inputValue));
                }}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                hrs
              </span>
            </div>
          </FormControl>
          <FormMessage className="sm:pl-2 text-center sm:text-left" />
        </FormItem>
      )}
    />
  )
}
