'use client'

import React, { useState } from 'react'
import { Plus, Phone, MessageSquare, Clock, Target, Settings } from 'lucide-react'
import { Button } from "@goaltime/ui-components"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@goaltime/ui-components"
import { Progress } from "@goaltime/ui-components"
import { Avatar, AvatarFallback, AvatarImage } from "@goaltime/ui-components"
import { Toggle } from "@goaltime/ui-components"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@goaltime/ui-components"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function Dashboard() {
  const goals = [
    { id: 1, name: "Startup Work", committed: 20, completed: 18, color: "#8884d8" },
    { id: 2, name: "Exercise", committed: 5, completed: 4, color: "#82ca9d" },
    { id: 3, name: "Learning Spanish", committed: 3, completed: 2, color: "#ffc658" },
  ]

  const schedule = [
    { id: 1, name: "Startup Work", time: "10:00 AM - 12:00 PM", callEnabled: true, messageEnabled: false },
    { id: 2, name: "Exercise", time: "1:00 PM - 2:00 PM", callEnabled: false, messageEnabled: true },
    { id: 3, name: "Learning Spanish", time: "7:00 PM - 8:00 PM", callEnabled: true, messageEnabled: true },
  ]

  const chartData = {
    week: [
      { name: 'Mon', "Startup Work": 4, "Exercise": 1, "Learning Spanish": 0.5 },
      { name: 'Tue', "Startup Work": 3, "Exercise": 1, "Learning Spanish": 0.5 },
      { name: 'Wed', "Startup Work": 4, "Exercise": 0, "Learning Spanish": 0.5 },
      { name: 'Thu', "Startup Work": 3, "Exercise": 1, "Learning Spanish": 0.5 },
      { name: 'Fri', "Startup Work": 4, "Exercise": 1, "Learning Spanish": 0 },
      { name: 'Sat', "Startup Work": 0, "Exercise": 0, "Learning Spanish": 0 },
      { name: 'Sun', "Startup Work": 0, "Exercise": 0, "Learning Spanish": 0 },
    ],
    month: [
      { name: 'Week 1', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2 },
      { name: 'Week 2', "Startup Work": 16, "Exercise": 3, "Learning Spanish": 2 },
      { name: 'Week 3', "Startup Work": 20, "Exercise": 5, "Learning Spanish": 3 },
      { name: 'Week 4', "Startup Work": 18, "Exercise": 4, "Learning Spanish": 2 },
    ],
  }
  const [timeRange, setTimeRange] = useState<keyof typeof chartData>('week')

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Time Manager</h1>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Your current goals and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.map((goal) => (
              <div key={goal.id} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.completed}/{goal.committed} hours
                  </span>
                </div>
                <Progress value={(goal.completed / goal.committed) * 100} className="h-2" color={goal.color} />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add New Goal</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Your protected time blocks</CardDescription>
          </CardHeader>
          <CardContent>
            {schedule.map((item) => (
              <div key={item.id} className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
                <div>
                  <Toggle
                    aria-label={`Toggle call for ${item.name}`}
                    pressed={item.callEnabled}
                    onPressedChange={() => {}}
                    className="mr-2"
                  >
                    <Phone className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    aria-label={`Toggle message for ${item.name}`}
                    pressed={item.messageEnabled}
                    onPressedChange={() => {}}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Toggle>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full"><Clock className="mr-2 h-4 w-4" /> Reschedule</Button>
              <Button className="w-full"><Target className="mr-2 h-4 w-4" /> Adjust Goal</Button>
              <Button className="w-full"><Settings className="mr-2 h-4 w-4" /> Preferences</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Goal Progress</CardTitle>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as keyof typeof chartData)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData[timeRange]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {goals.map((goal) => (
                  <Bar key={goal.id} dataKey={goal.name} fill={goal.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
