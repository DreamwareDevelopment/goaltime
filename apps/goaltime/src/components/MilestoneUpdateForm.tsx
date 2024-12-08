'use client'

import { Checkbox } from "@/ui-components/checkbox"
import { Button } from "@/ui-components/button"
import { Check, X, Trash2 } from "lucide-react"
import { Form, FormControl, FormItem, FormField } from "@/ui-components/form"
import { SubmitHandler, useForm } from "react-hook-form"
import { MilestoneInput } from "@/shared/zod"
import { useValtio } from "./data/valtio"
import { useState } from "react"
import { Input } from "@/libs/ui-components/src/components/ui/input"
import { useToast } from "@/libs/ui-components/src/hooks/use-toast"


export interface MilestoneUpdateFormProps extends React.HTMLAttributes<HTMLLIElement> {
  milestone: MilestoneInput
}

export function MilestoneUpdateForm({ milestone, ...props }: MilestoneUpdateFormProps) {
  const { goalStore } = useValtio()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const { deleteMilestone, updateMilestone } = goalStore
  const form = useForm<MilestoneInput>({
    defaultValues: milestone
  })
  const { handleSubmit, formState } = form
  if (Object.keys(formState.errors).length > 0) {
    console.log('MilestoneUpdateForm form errors', formState.errors)
  }

  const onSubmit: SubmitHandler<MilestoneInput> = async (data, event) => {
    event?.preventDefault()
    try {
      await updateMilestone(data)
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error updating milestone",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMilestone(milestone)
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error deleting milestone",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  return (
    <li {...props}>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="completed"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    id={`milestone-${milestone.id}`}
                    checked={field.value}
                    onCheckedChange={e => {
                      field.onChange(e)
                      handleSubmit(onSubmit)()
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-grow"
                        autoFocus
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            e.stopPropagation()
                            form.reset()
                            setIsEditing(false)
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                className="flex-shrink-0"
                onMouseDown={() => handleSubmit(onSubmit)()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                type="button"
                size="icon"
                onClick={() => {
                  setIsEditing(false)
                }}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 w-full">
              <label
                htmlFor={`milestone-${milestone.id}`}
                className={`cursor-pointer flex-grow ${
                  form.watch("completed") ? "line-through text-muted-foreground" : ""
                }`}
                onClick={() => setIsEditing(true)}
              >
                {form.watch("text")}
              </label>
              <Button
                className="flex-shrink-0"
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </Form>
    </li>
  )
}
