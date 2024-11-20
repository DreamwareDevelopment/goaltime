'use client'

import React, { useState } from 'react'
import { Plus, Phone, MessageSquare, Clock, Target, Settings, Bell, Trash2 } from 'lucide-react'
import { Button } from "@/ui-components/button"
import { ScrollArea } from "@/ui-components/scroll-area"
import { Checkbox } from "@/ui-components/checkbox"
import { Separator } from "@/ui-components/separator"
import { Carousel, CarouselMainContainer, CarouselThumbsContainer, SliderMainItem, SliderThumbItem } from "@/ui-components/carousel"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { Progress } from "@/ui-components/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui-components/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs"
import { Toggle } from "@/ui-components/toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui-components/select"
import { MultiSelect, Option } from "@/ui-components/multi-select"
import { FloatingLabelInput } from "@/ui-components/floating-input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui-components/accordion"
import { PlateEditor } from "@/plate-ui/plate-editor"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function Dashboard() {
  const goals = [
    { id: 1, name: "Startup Work", committed: 20, completed: 18, color: "#8884d8" },
    { id: 2, name: "Exercise", committed: 5, completed: 4, color: "#82ca9d" },
    { id: 3, name: "Learning Spanish", committed: 3, completed: 2, color: "#ffc658" },
    { id: 4, name: "Reading", committed: 10, completed: 7, color: "#ff7f50" },
    { id: 5, name: "Meditation", committed: 7, completed: 5, color: "#6a5acd" },
    { id: 6, name: "Cooking", committed: 8, completed: 6, color: "#48d1cc" }
  ]
  const [milestones, setMilestones] = useState([
    { id: 1, text: "Review project proposal", completed: false },
    { id: 2, text: "Prepare for team meeting", completed: true },
    { id: 3, text: "Update progress report", completed: false },
  ])
  const [newMilestone, setNewMilestone] = useState("")

  const schedule = [
    { id: 1, name: "Startup Work", time: "10:00 AM - 12:00 PM", callEnabled: true, messageEnabled: false, pushEnabled: false },
    { id: 2, name: "Exercise", time: "1:00 PM - 2:00 PM", callEnabled: false, messageEnabled: true, pushEnabled: false },
    { id: 3, name: "Learning Spanish", time: "7:00 PM - 8:00 PM", callEnabled: true, messageEnabled: true, pushEnabled: true },
    { id: 4, name: "Reading", time: "3:00 PM - 4:00 PM", callEnabled: false, messageEnabled: false, pushEnabled: true },
    { id: 5, name: "Meditation", time: "6:00 AM - 6:30 AM", callEnabled: false, messageEnabled: false, pushEnabled: false },
    { id: 6, name: "Cooking", time: "5:00 PM - 6:00 PM", callEnabled: true, messageEnabled: false, pushEnabled: false },
  ]

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
  const [timeRange, setTimeRange] = useState<keyof typeof chartData>('week')
  const [selectedGoals, setSelectedGoals] = useState<Option[]>([])

  const allGoals: Option[] = goals.map((goal) => ({ value: goal.name, label: goal.name, color: goal.color }))
  const filteredGoals = selectedGoals.length > 0 ? goals.filter(goal => selectedGoals.findIndex(sg => sg.value === goal.name) > -1) : goals

  const addMilestone = () => {
    if (newMilestone.trim() !== "") {
      setMilestones([...milestones, { id: Date.now(), text: newMilestone.trim(), completed: false }])
      setNewMilestone("")
    }
  }

  const toggleMilestone = (id: number) => {
    setMilestones(milestones.map(milestone =>
      milestone.id === id ? { ...milestone, completed: !milestone.completed } : milestone
    ))
  }

  const deleteMilestone = (id: number) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id))
  }

  const clearCompletedMilestones = () => {
    setMilestones(milestones.filter(milestone => !milestone.completed))
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Goal Time</h1>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2 overflow-hidden">
          <Carousel orientation="vertical" className="flex items-center gap-2">
            <div className="relative basis-3/4 ">
              <CarouselMainContainer className="h-[793px]">
                {goals.map((goal, index) => (
                  <SliderMainItem
                    key={goal.id}
                    className="border border-muted flex items-center justify-center h-52 rounded-md"
                  >
                    <ScrollArea className="w-full h-full">
                      <Accordion type="single" className="w-full h-full" defaultValue="milestones">
                        <AccordionItem value="milestones" className="border-none">
                          <AccordionTrigger className="text-xl font-bold px-8">Milestones</AccordionTrigger>
                          <AccordionContent className="w-full h-full">
                            <Tabs defaultValue="daily" className="w-full">
                              <div className="w-full pl-6 pr-8">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="daily">Daily</TabsTrigger>
                                  <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
                                </TabsList>
                              </div>
                              <TabsContent value="daily">
                                <Card className="w-full h-full border-none shadow-none">
                                  <CardContent>
                                    <ul className="space-y-4">
                                      {milestones.map((milestone) => (
                                        <li key={milestone.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`milestone-${milestone.id}`}
                                            checked={milestone.completed}
                                            onCheckedChange={() => toggleMilestone(milestone.id)}
                                          />
                                          <label
                                            htmlFor={`milestone-${milestone.id}`}
                                            className={`flex-grow ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
                                          >
                                            {milestone.text}
                                          </label>
                                          <Button
                                            className="flex-shrink-0"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteMilestone(milestone.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </li>
                                      ))}
                                      <li className="flex items-center space-x-4 pt-4 pr-3">
                                        <FloatingLabelInput
                                          className="flex-grow"
                                          type="text"
                                          label="Add a new milestone..."
                                          value={newMilestone}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
                                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addMilestone()}
                                        />
                                        <Button onClick={addMilestone}>Add</Button>
                                      </li>
                                    </ul>
                                  </CardContent>
                                  <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
                                    <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
                                  </CardFooter>
                                </Card>
                              </TabsContent>
                              <TabsContent value="lifetime">
                                <Card className="w-full h-full border-none shadow-none">
                                  <CardContent>
                                    <ul className="space-y-4">
                                      {milestones.map((milestone) => (
                                        <li key={milestone.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`milestone-${milestone.id}`}
                                            checked={milestone.completed}
                                            onCheckedChange={() => toggleMilestone(milestone.id)}
                                          />
                                          <label
                                            htmlFor={`milestone-${milestone.id}`}
                                            className={`flex-grow ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
                                          >
                                            {milestone.text}
                                          </label>
                                          <Button
                                            className="flex-shrink-0"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteMilestone(milestone.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </li>
                                      ))}
                                      <li className="flex items-center space-x-4 pt-4 pr-3">
                                        <FloatingLabelInput
                                          className="flex-grow"
                                          type="text"
                                          label="Add a new milestone..."
                                          value={newMilestone}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
                                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addMilestone()}
                                        />
                                        <Button onClick={addMilestone}>Add</Button>
                                      </li>
                                    </ul>
                                  </CardContent>
                                  <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
                                    <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
                                  </CardFooter>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          </AccordionContent>
                        </AccordionItem>
                        <div className="pl-6 pr-4">
                          <Separator />
                        </div>
                        <AccordionItem value="notes" className="border-none">
                          <AccordionTrigger className="text-xl font-bold px-8">Today&apos;s Notes</AccordionTrigger>
                          <AccordionContent className="p-6 pt-0">
                            <div className="h-full w-full" data-registry="plate">
                              <PlateEditor />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <div className="pl-6 pr-4">
                          <Separator />
                        </div>
                        <AccordionItem value="settings" className="border-none">
                          <AccordionTrigger className="text-xl font-bold px-8">Settings</AccordionTrigger>
                          <AccordionContent className="p-6 pt-0">
                            TODO: Add settings
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </ScrollArea>
                  </SliderMainItem>
                ))}
              </CarouselMainContainer>
            </div>
            <CarouselThumbsContainer className="basis-1/4 max-h-[793px]">
              {goals.map((goal, index) => (
                <SliderThumbItem
                  key={goal.id}
                  index={index}
                  color={goal.color}
                  className="rounded-md bg-transparent"
                >
                  <span className="border border-muted flex items-center justify-center h-full w-full rounded-md cursor-pointer bg-background">
                    {goal.name}
                  </span>
                </SliderThumbItem>
              ))}
              <SliderThumbItem
                key="new-goal"
                index={goals.length}
                className="rounded-md bg-accent"
                onButtonClick={() => {
                  console.log("new goal")
                }}
              >
                <span className="border border-muted flex items-center justify-center h-full w-full rounded-md cursor-pointer bg-background">
                  New Goal
                </span>
              </SliderThumbItem>
            </CarouselThumbsContainer>
          </Carousel>
        </Card>
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
                    className="mr-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    aria-label={`Toggle push notifications for ${item.name}`}
                    pressed={item.pushEnabled}
                    onPressedChange={() => {}}
                  >
                    <Bell className="h-4 w-4" />
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2">
            <CardTitle>Goal Progress</CardTitle>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as keyof typeof chartData)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350} className="pr-8">
              <BarChart data={chartData[timeRange]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {filteredGoals.map((goal) => (
                  <Bar key={goal.id} dataKey={goal.name} fill={goal.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <CardFooter>
              <MultiSelect
                className="w-full mt-4"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
