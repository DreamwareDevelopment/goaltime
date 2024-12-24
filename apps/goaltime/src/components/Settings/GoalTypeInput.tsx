import { UseFormReturn } from 'react-hook-form'

import { GoalInput } from '@/shared/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-components/tabs'

import { CommitmentInput, DeadlineInput } from './TimeInputs.tsx'
import { EstimateInput } from './TimeInputs.tsx'

interface GoalTypeInputProps {
  form: UseFormReturn<GoalInput>
  goal?: GoalInput
}

export const GoalTypeInput = ({ form, goal }: GoalTypeInputProps) => {
  const goalType = goal?.estimate ? 'one-time' : 'recurring'
  return (
    <Tabs defaultValue={goalType} className="mt-4">
      <TabsList className="w-full mb-1">
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
          <DeadlineInput form={form} />
          <EstimateInput form={form} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
