import { UseFormReturn } from 'react-hook-form'

import { GoalInput } from '@/shared/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-components/tabs'

import { DeadlineInput } from './TimeInputs.tsx'
import { CommitmentInput, EstimateInput } from './Inputs.tsx'

interface GoalTypeInputProps {
  form: UseFormReturn<GoalInput>
  goal?: GoalInput
}

export const GoalTypeInput = ({ form, goal }: GoalTypeInputProps) => {
  const goalType = goal?.estimate ? 'one-time' : 'recurring'
  return (
    <Tabs defaultValue={goalType}>
      <TabsList className="w-full">
        <TabsTrigger className="w-full" value="recurring">Weekly</TabsTrigger>
        <TabsTrigger className="w-full" value="one-time">One Time</TabsTrigger>
      </TabsList>
      <TabsContent value="recurring" className="flex justify-center">
        <div className="flex justify-center">
          <CommitmentInput form={form} />
        </div>
      </TabsContent>
      <TabsContent value="one-time">
        <div className="flex flex-wrap justify-around gap-4">
          <EstimateInput form={form} />
          <DeadlineInput form={form} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
