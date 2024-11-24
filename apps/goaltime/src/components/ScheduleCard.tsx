import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutList } from "lucide-react";
import React, { useState } from 'react';

import { Button } from "@/ui-components/button";
import { Calendar } from "@/ui-components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui-components/popover";
import { Separator } from "@/ui-components/separator";
import { cn } from "@/libs/ui-components/src/utils";
import { ScrollArea } from "@/ui-components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/libs/ui-components/src/components/ui/card";
import { Accordion, AccordionTrigger, AccordionItem, AccordionContent } from "@/libs/ui-components/src/components/ui/accordion";

interface Schedule {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  color: string;
}

const fakeData: Schedule[] = [
  {
    id: 1,
    title: "Morning Jog",
    subtitle: "Daily Exercise",
    description: "Jogging in the park",
    startTime: "06:00",
    endTime: null,
    isAllDay: true,
    color: "bg-green-500"
  },
  {
    id: 2,
    title: "Team Meeting",
    subtitle: "Project Discussion",
    description: "Discuss project milestones",
    startTime: "09:00",
    endTime: "10:00",
    isAllDay: false,
    color: "bg-blue-500"
  },
  {
    id: 3,
    title: "Lunch Break",
    subtitle: "Relax and Recharge",
    description: "Lunch with colleagues",
    startTime: "12:00",
    endTime: "13:00",
    isAllDay: false,
    color: "bg-yellow-500"
  },
  {
    id: 4,
    title: "Client Call",
    subtitle: "Monthly Update",
    description: "Update client on project status",
    startTime: "15:00",
    endTime: "16:00",
    isAllDay: false,
    color: "bg-red-500"
  },
  {
    id: 5,
    title: "Evening Yoga",
    subtitle: "Relaxation",
    description: "Yoga session at home",
    startTime: "18:00",
    endTime: "19:00",
    isAllDay: false,
    color: "bg-purple-500"
  }
];

interface ScheduleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  schedule?: Schedule[];
}

export const ScheduleCard = ({ schedule = fakeData, className }: ScheduleCardProps) => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('timeline');
  const [is24Hour, setIs24Hour] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const navigateDay = (direction: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + direction);
    setDate(newDate);
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    if (is24Hour) return `${hours}:${minutes}`;
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const HOUR_HEIGHT = 60; // pixels per hour
  
  const getEventPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    return (hours * HOUR_HEIGHT) + ((minutes / 60) * HOUR_HEIGHT);
  };

  const getEventHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startInMinutes = (startHours * 60) + startMinutes;
    const endInMinutes = (endHours * 60) + endMinutes;
    return ((endInMinutes - startInMinutes) / 60) * HOUR_HEIGHT;
  };

  const allDayEvents = schedule.filter(event => event.isAllDay);
  const TimelineView = () => (
    <div className="h-full w-full">
      {allDayEvents.length > 0 && (
        <Accordion type="single" defaultValue="allDayEvents" collapsible className="pb-3">
          <AccordionItem value="allDayEvents">
            <AccordionTrigger>
              <h3 className="font-medium mb-1 ml-2">All-Day Events</h3>
            </AccordionTrigger>
            <AccordionContent>
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "px-2 mb-2 rounded-md",
                    event.color,
                    "text-primary"
                  )}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.subtitle && <div className="text-sm italic">{event.subtitle}</div>}
                  {event.description && <div className="text-sm">{event.description}</div>}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Scrollable Timeline */}
      <ScrollArea className="h-[500px]">
        <div className="relative w-[500px]" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Hour markers and separators */}
          {Array.from({ length: 24 }, (_, i) => (
            <div 
              key={i} 
              className="absolute w-full"
              style={{ top: `${i * HOUR_HEIGHT}px` }}
            >
              <div className="grid grid-cols-[84px_1fr] gap-2">
                <div className="text-sm text-muted-foreground text-nowrap sticky left-0">
                  {formatTime(`${String(i).padStart(2, '0')}:00`)}
                </div>
                <Separator className="mt-2" />
              </div>
            </div>
          ))}

          {/* Events */}
          <div className="absolute left-[110px] right-2">
            {schedule
              .filter(event => !event.isAllDay && event.startTime && event.endTime)
              .map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "absolute px-2 mt-2 rounded-md w-[calc(100%-8px)]",
                    event.color,
                    "text-primary"
                  )}
                  style={{
                    top: `${getEventPosition(event.startTime || '')}px`,
                    height: `${getEventHeight(event.startTime || '', event.endTime || '')}px`,
                    minHeight: '20px'
                  }}
                >
                  <div className="text-sm">
                    {event.title}
                    {getEventHeight(event.startTime || '', event.endTime || '') < 45 && (
                      <span>, {formatTime(event.startTime || '')} - {formatTime(event.endTime || '')}</span>
                    )}
                  </div>
                  {getEventHeight(event.startTime || '', event.endTime || '') >= 45 && (
                    <div className="text-sm">
                      {formatTime(event.startTime || '')} - {formatTime(event.endTime || '')}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  const ListView = () => (
    <ScrollArea className="h-[576px] pt-3 w-full">
      {schedule.map(event => (
        <div
          key={event.id}
          className={cn(
            "flex-shrink-0",
            "p-3 mb-2 rounded-md",
            event.color,
            "text-primary"
          )}
        >
          <div className="font-medium">{event.title}</div>
          {event.subtitle && <div className="text-sm italic">{event.subtitle}</div>}
          {event.description && <div className="text-sm">{event.description}</div>}
          {!event.isAllDay && (
            <div className="text-sm mt-1">
              {formatTime(event.startTime || '')} - {formatTime(event.endTime || '')}
            </div>
          )}
          {event.isAllDay && <div className="text-sm mt-1">All Day</div>}
        </div>
      ))}
    </ScrollArea>
  );

  const DateToolbar = ({ className }: { className?: string }) => (
    <div className={className}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateDay(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-[240px]",
            )}
          >
            {format(date, "EEE do MMMM")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate || new Date());
              setCalendarOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateDay(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  const ViewToolbar = ({ className }: { className?: string }) => (
    <div className={className}>
      <Button
        variant="outline"
        onClick={() => setIs24Hour(!is24Hour)}
      >
        {is24Hour ? "24h" : "12h"}
      </Button>
      <Button
        variant="outline"
        onClick={() => setDate(new Date())}
      >
        Today
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setView(view === 'timeline' ? 'list' : 'timeline')}
      >
        {view === 'timeline' ? (
          <LayoutList className="h-4 w-4" />
        ) : (
          <CalendarIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  )

  return (
    <Card className={cn("h-full w-full", className)}>
      <CardHeader className="flex flex-col items-center gap-2 pt-2 pb-1">
        <CardTitle className="sr-only">Schedule</CardTitle>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <DateToolbar className="flex items-center justify-between space-x-2" />
          <ViewToolbar className="flex items-center justify-between space-x-2" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between gap-4 pb-4">
        {view === 'timeline' ? <TimelineView /> : <ListView />}
      </CardContent>
    </Card>
  );
};
