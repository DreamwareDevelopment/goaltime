import { UseFormReturn } from "react-hook-form";
import { Palette } from "lucide-react";
import { HexColorPicker } from "react-colorful";

import { Button } from "@/ui-components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui-components/popover";
import { FormControl, FormField, FormItem, FormMessage } from "@/ui-components/form";
import { GoalInput } from "@/shared/zod";

export const COLOR_PRESETS = [
  '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3',
  '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'
]

export interface ColorPickerProps {
  form: UseFormReturn<GoalInput>;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="color"
      render={({ field }) => (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <FormItem className="flex flex-col space-y-[20px]">
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="justify-start text-left font-normal"
                    >
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: field.value }} 
                      />
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <HexColorPicker 
                      color={field.value} 
                      onChange={field.onChange} 
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded-md border border-gray-200"
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </FormControl>
            </FormItem>
          </div>
          <FormMessage />
        </div>
      )}
    />
  )
}