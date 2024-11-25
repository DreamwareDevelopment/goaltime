import { AutosizeTextarea } from "@/libs/ui-components/src/components/ui/text-area";

import { Goal } from "../GoalSettingsCard";
import { useState } from "react";
import { FloatingLabelInput } from "@/libs/ui-components/src/components/ui/floating-input";
import { Input } from "@/libs/ui-components/src/components/ui/input";
import { Label } from "@/libs/ui-components/src/components/ui/label";

export interface DescriptionInputProps {
  goal: Goal;
}

export const DescriptionInput: React.FC<DescriptionInputProps> = ({ goal }) => {
  const [description, setDescription] = useState(goal.description || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }

  return (
    <AutosizeTextarea
      id="description"
      name="description"
      value={description}
      onChange={handleInputChange}
      placeholder="Description (optional)"
    />
  )
}

export interface TitleInputProps {
  goal: Goal;
}

export const TitleInput: React.FC<TitleInputProps> = ({ goal }) => {
  const [title, setTitle] = useState(goal.title);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }

  return (
    <FloatingLabelInput
      id="title"
      name="title"
      value={title}
      onChange={handleInputChange}
      label="Title"
    />
  )
}

export interface CommitmentInputProps {
  goal: Goal;
}

export const CommitmentInput: React.FC<CommitmentInputProps> = ({ goal }) => {
  const [commitment, setCommitment] = useState(goal.commitment);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (isNaN(Number(value))) throw new Error('Invalid input');
    setCommitment(Number(value))
  }

  return (
    <div className="space-y-2">
      <Label className="ml-2 text-nowrap" htmlFor="commitment">Weekly Commitment</Label>
      <div className="relative">
        <Input
          id="commitment"
          name="commitment"
          type="number"
          value={commitment}
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
