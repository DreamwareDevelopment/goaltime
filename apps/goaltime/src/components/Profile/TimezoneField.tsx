import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/ui-components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui-components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui-components/popover";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/ui-components/form";
import { UseFormReturn } from "react-hook-form";
import { UserProfileInput } from "@/shared/zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supportedTimezones = (Intl as any).supportedValuesOf('timeZone') as string[];

interface TimezoneFieldProps {
  form: UseFormReturn<UserProfileInput>;
}

export function TimezoneField({ form }: TimezoneFieldProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <FormField
      control={form.control}
      name="timezone"
      render={({ field }) => (
        <FormItem className="mb-4">
          <FormLabel className="pl-2">
            Timezone
          </FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between my-2"
                >
                  {field.value || "Select a timezone..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search timezone..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No timezone found.</CommandEmpty>
                    <CommandGroup>
                      {supportedTimezones.map((supportedTimezone) => (
                        <CommandItem
                          key={supportedTimezone}
                          value={supportedTimezone}
                          onSelect={(currentValue) => {
                            field.onChange(currentValue);
                            setOpen(false);
                          }}
                        >
                          {supportedTimezone}
                          <Check
                            className={`ml-auto ${field.value === supportedTimezone ? "opacity-100" : "opacity-0"}`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage className="pl-2" />
        </FormItem>
      )}
    />
  );
}