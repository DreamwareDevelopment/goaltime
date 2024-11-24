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

export const ScheduleCard = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('timeline');
  const [is24Hour, setIs24Hour] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const events = [
    {
      id: 1,
      title: "Ads Campaign Nr2",
      subtitle: "Day 2 of 5",
      description: "AdSense + FB, Target Audience: SMB2-Delta3",
      startTime: null,
      endTime: null,
      isAllDay: true,
      color: "bg-amber-700"
    },
    {
      id: 2,
      title: "Meditation Session",
      startTime: "02:00",
      endTime: "03:30",
      color: "bg-blue-600"
    },
    {
      id: 3,
      title: "Code Review",
      startTime: "04:00",
      endTime: "05:30",
      color: "bg-green-700"
    },
    {
      id: 4,
      title: "Breakfast Break",
      startTime: "06:30",
      endTime: "07:30",
      color: "bg-amber-700"
    }
  ];

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

  const TimelineView = () => (
    <div className="h-full w-full">
      {/* All-day events section remains the same */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Full-Day Events</h3>
        {events.filter(event => event.isAllDay).map(event => (
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
      </div>

      {/* Scrollable Timeline */}
      <ScrollArea className="h-[600px]">
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
            {events
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
    <ScrollArea className="h-[600px] pr-4 w-full">
      {events.map(event => (
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

  return (
    <div className="p-4 flex flex-col h-full w-full">
      <div className="flex flex-col items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
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
        <div className="w-full flex items-center justify-between space-x-2">
          <Button
            variant="outline"
            className={ is24Hour ? "bg-background text-primary" : "bg-foreground text-primary-foreground" }
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
      </div>

      {view === 'timeline' ? <TimelineView /> : <ListView />}
    </div>
  );
};
