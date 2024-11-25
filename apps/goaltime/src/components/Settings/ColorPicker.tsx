'use client'

import { Palette } from "lucide-react";
import { HexColorPicker } from "react-colorful";

import { Button } from "@/libs/ui-components/src/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/libs/ui-components/src/components/ui/popover";
import { Label } from "@/libs/ui-components/src/components/ui/label";

import { Goal } from "../GoalSettingsCard";
import { useState } from "react";

const COLOR_PRESETS = [
  '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3',
  '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'
]

export interface ColorPickerProps {
  goal: Goal;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ goal }) => {
  // TODO: Proper state management
  const [color, setColor] = useState(goal.color);
  return (
    <div className="flex flex-col space-y-[20px] pt-1">
      <Label className="ml-2">Color</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal"
          >
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }} />
            <Palette className="mr-2 h-4 w-4" />
            <span>{color}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <HexColorPicker color={color} onChange={(color) => setColor(color)} />
          <div className="flex flex-wrap gap-1 mt-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded-md border border-gray-200"
                style={{ backgroundColor: color }}
                onClick={() => setColor(color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}