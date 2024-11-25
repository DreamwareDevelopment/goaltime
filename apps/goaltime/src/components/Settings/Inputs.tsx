import { AutosizeTextarea } from "@/libs/ui-components/src/components/ui/text-area";

import { Goal } from "../GoalSettingsCard";
import { FloatingLabelInput } from "@/libs/ui-components/src/components/ui/floating-input";
import { Input } from "@/libs/ui-components/src/components/ui/input";
import { Label } from "@/libs/ui-components/src/components/ui/label";

export interface TitleInputProps {
  goal: Goal;
  onChange: <T extends keyof Goal>(field: T, value: Goal[T]) => void;
}

export const TitleInput: React.FC<TitleInputProps> = ({ goal, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('title', e.target.value);
  }

  return (
    <FloatingLabelInput
      id="title"
      name="title"
      value={goal.title}
      onChange={handleInputChange}
      label="Title"
    />
  )
}

export interface DescriptionInputProps {
  goal: Goal;
  onChange: <T extends keyof Goal>(field: T, value: Goal[T]) => void;
}

export const DescriptionInput: React.FC<DescriptionInputProps> = ({ goal, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange('description', e.target.value);
  }

  return (
    <AutosizeTextarea
      id="description"
      name="description"
      value={goal.description}
      onChange={handleInputChange}
      placeholder="Description (optional)"
    />
  )
}

export interface CommitmentInputProps {
  goal: Goal;
  onChange: <T extends keyof Goal>(field: T, value: Goal[T]) => void;
}

export const CommitmentInput: React.FC<CommitmentInputProps> = ({ goal, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (isNaN(Number(value))) throw new Error('Invalid input');
    onChange('commitment', Number(value));
  }

  return (
    <div className="space-y-2">
      <Label className="ml-2 text-nowrap" htmlFor="commitment">Weekly Commitment</Label>
      <div className="relative">
        <Input
          id="commitment"
          name="commitment"
          type="number"
          value={goal.commitment}
          onChange={handleInputChange}
          min={0}
          placeholder="Enter..."
          className="pr-10"
        />
        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          hrs
        </span>
      </div>
    </div>
  )
}
