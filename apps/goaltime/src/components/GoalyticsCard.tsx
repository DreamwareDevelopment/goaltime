"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useSnapshot } from "valtio"

import { CardHeader, CardTitle, CardContent, CardFooter } from "@/ui-components/card"
import { MultiSelect, Option } from "@/ui-components/multi-select"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/ui-components/select"

import { useValtio } from "./data/valtio"

const chartData = {
  week: [
    { name: 'Mon', "Startup Work": 4, "Exercise": 1, "Learning Spanish": 0.5, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
    { name: 'Tue', "Startup Work": 3, "Exercise": 1, "Learning Spanish": 0.5, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
    { name: 'Wed', "Startup Work": 4, "Exercise": 0, "Learning Spanish": 0.5, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
    { name: 'Thu', "Startup Work": 3, "Exercise": 1, "Learning Spanish": 0.5, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
    { name: 'Fri', "Startup Work": 4, "Exercise": 1, "Learning Spanish": 0, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
    { name: 'Sat', "Startup Work": 0, "Exercise": 0, "Learning Spanish": 0, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
    { name: 'Sun', "Startup Work": 0, "Exercise": 0, "Learning Spanish": 0, "Reading": 1, "Meditation": 0.5, "Cooking": 1 },
  ],
  month: [
    { name: 'Week 1', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2, "Reading": 5, "Meditation": 3.5, "Cooking": 5 },
    { name: 'Week 2', "Startup Work": 16, "Exercise": 3, "Learning Spanish": 2, "Reading": 5, "Meditation": 3.5, "Cooking": 5 },
    { name: 'Week 3', "Startup Work": 20, "Exercise": 5, "Learning Spanish": 3, "Reading": 5, "Meditation": 3.5, "Cooking": 5 },
    { name: 'Week 4', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2, "Reading": 5, "Meditation": 3.5, "Cooking": 5 },
  ],
  year: [
    { name: 'Jan', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Feb', "Startup Work": 16, "Exercise": 3, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Mar', "Startup Work": 20, "Exercise": 5, "Learning Spanish": 3, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Apr', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'May', "Startup Work": 16, "Exercise": 3, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Jun', "Startup Work": 20, "Exercise": 5, "Learning Spanish": 3, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Jul', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Aug', "Startup Work": 16, "Exercise": 3, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Sep', "Startup Work": 20, "Exercise": 5, "Learning Spanish": 3, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Oct', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Nov', "Startup Work": 16, "Exercise": 3, "Learning Spanish": 2, "Reading": 20, "Meditation": 14, "Cooking": 20 },
    { name: 'Dec', "Startup Work": 20, "Exercise": 5, "Learning Spanish": 3, "Reading": 20, "Meditation": 14, "Cooking": 20 },
  ],
}

export function GoalyticsCard() {
  const { goalStore } = useValtio()
  if (!goalStore.goals) {
    throw new Error('Invariant: goals not initialized before using GoalyticsCard')
  }
  const goals = useSnapshot(goalStore.goals)

  const [timeRange, setTimeRange] = useState<keyof typeof chartData>('week')
  const [selectedGoals, setSelectedGoals] = useState<Option[]>([])

  const allGoals: Option[] = goals.map((goal) => ({ value: goal.id, label: goal.title, color: goal.color }))
  const filteredGoals = selectedGoals.length > 0 ? goals.filter(goal => selectedGoals.findIndex(sg => sg.value === goal.id) > -1) : goals

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pt-4">
        <CardTitle className="pl-4">Goalytics</CardTitle>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as keyof typeof chartData)}>
          <SelectTrigger className="w-[180px] mr-4">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ResponsiveContainer width="100%" height={350} className="p-0">
          <BarChart data={chartData[timeRange]} margin={{ left: -37 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {filteredGoals.map((goal) => (
              <Bar key={goal.id} dataKey={goal.id} fill={goal.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="p-0 mt-4">
        <MultiSelect
          className="w-full"
          defaultOptions={allGoals}
          placeholder="Select goals to track"
          hidePlaceholderWhenSelected
          hideClearAllButton
          value={selectedGoals.length > 0 ? selectedGoals : allGoals}
          onChange={(value) => {
            setSelectedGoals(value)
          }}
        />
      </CardFooter>
    </>
  )
}