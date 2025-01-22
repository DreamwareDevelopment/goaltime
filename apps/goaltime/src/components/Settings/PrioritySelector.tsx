import { UseFormReturn } from "react-hook-form";
import { Label } from "@/ui-components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui-components/select";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { GoalInput } from "@/shared/zod";

export type Priority = 'High' | 'Medium' | 'Low'
const PRIORITIES: { [key in Priority]: string } = {
  High: 'Time allocated first',
  Medium: 'Time allocated next',
  Low: 'Time allocated last',
}

export interface PrioritySelectorProps {
  form: UseFormReturn<GoalInput>;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="priority"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <Label className="ml-2" htmlFor="priority">Priority Level</Label>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="priority" className="bg-secondary border-none">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITIES).map(([priority, description]) => (
                  <SelectItem key={priority} value={priority}>
                    {priority} - {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage className="ml-2" />
        </FormItem>
      )}
    />
  )
}
