import { UseFormReturn } from "react-hook-form";
import { HexColorPicker } from "react-colorful";

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
                <>
                  <HexColorPicker 
                    color={field.value}
                    onChange={field.onChange} 
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-md border border-gray-200"
                        type="button"
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </div>
                </>
              </FormControl>
            </FormItem>
          </div>
          <FormMessage />
        </div>
      )}
    />
  )
}
