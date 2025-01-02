"use client"

import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutList, RefreshCw } from "lucide-react";
import React, { useEffect, useRef, useState } from 'react';

import { cn } from "@/ui-components/utils";
import { Button } from "@/ui-components/button";
import { Calendar } from "@/ui-components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui-components/popover";
import { Separator } from "@/ui-components/separator";
import { ScrollArea } from "@/ui-components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui-components/card";
import { Accordion, AccordionTrigger, AccordionItem, AccordionContent } from "@/ui-components/accordion";
import { binarySearchInsert, dayjs, debounce, truncateText } from "@/shared/utils";
import { CalendarEvent, CalendarProvider } from "@prisma/client";
import { LoadingSpinner } from "@/ui-components/svgs/spinner";
import { useValtio } from "./data/valtio";
import { useSnapshot } from "valtio";
import { useToast } from "@/ui-components/hooks/use-toast";
import { Credenza, CredenzaTrigger } from "@/ui-components/credenza";
import { EventModal } from "./Calendar/EventModal";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/ui-components/tooltip";
import { syncCalendarAction } from "../app/actions/calendar";

export interface ViewFields {
  top: number;
  height: number;
  left: number;
  hours: number | null;
  minutes: number | null;
}

interface ViewFieldsWithCalendarEvent {
  event: CalendarEvent;
  viewFields: ViewFields;
}

export const ScheduleCard = ({ className }: React.HTMLAttributes<HTMLDivElement>) => {
  const [date, setDate] = useState(new Date());
  const day = date.toDateString();
  const now = new Date();
  const { calendarStore, userStore } = useValtio();
  calendarStore.ensureCalendarEvents(date);
  const schedule = useSnapshot(calendarStore.events[day]);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const profile = useSnapshot(userStore.profile!);
  const { toast } = useToast();
  const isToday = now.toDateString() === date.toDateString();
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState('timeline');
  const [is24Hour, setIs24Hour] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timezone, setTimezone] = useState<string>(profile.timezone);
  const [showTimezoneWarning, setShowTimezoneWarning] = useState<boolean>(false);

  useEffect(() => {
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone !== clientTimezone) {
      setShowTimezoneWarning(true);
    }
    setTimezone(clientTimezone);
  // We only want to run this once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const clearDebounce = debounce(async () => {
      try {
        await calendarStore.loadCalendarEvents(date, timezone)
      } catch (error) {
        console.error(error);
        toast({
          title: 'Failed to load schedule',
          description: 'Please try again',
        });
      } finally {
        setIsLoading(false);
      }
    })
    return clearDebounce;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timezone]);

  const navigateDay = (direction: number) => {
    setIsLoading(true);
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + direction);
    setDate(newDate);
  };

  const changeTimezone = () => {
    setIsLoading(true);
    userStore.updateUserProfile(profile, {
      userId: profile.userId,
      timezone: timezone
    }).then(() => {
      setTimezone(timezone);
      setShowTimezoneWarning(false);
    }).catch(error => {
      console.error(error);
      toast({
        title: 'Failed to change timezone',
        description: 'Please try again',
        variant: 'destructive',
      });
    });
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
  
  const getEventPosition = (startTime: dayjs.Dayjs) => {
    return (startTime.hour() * HOUR_HEIGHT) + ((startTime.minute() / 60) * HOUR_HEIGHT);
  };

  const getEventHeight = (startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) => {
    const startInMinutes = (startTime.hour() * 60) + startTime.minute();
    const endInMinutes = (endTime.hour() * 60) + endTime.minute();
    return ((endInMinutes - startInMinutes) / 60) * HOUR_HEIGHT;
  };

  const allDayEvents: CalendarEvent[] = [];
  const events: ViewFieldsWithCalendarEvent[] = [];
  for (const event of schedule ?? []) {
    if (!event.allDay && event.startTime && event.endTime) {
      const startTime = dayjs.utc(event.startTime).tz(timezone);
      const endTime = dayjs.utc(event.endTime).tz(timezone);
      const viewFields = {
        hours: startTime.hour(),
        minutes: startTime.minute(),
        top: getEventPosition(startTime),
        height: getEventHeight(startTime, endTime),
        left: 0
      };
      binarySearchInsert(events, { event, viewFields }, (a, b) => a.viewFields.top - b.viewFields.top);
    } else if (event.allDay) {
      allDayEvents.push(event);
    }
  }
  const shiftOverlappingEvents = (events: ViewFieldsWithCalendarEvent[]) => {
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (events[j].viewFields.top >= events[i].viewFields.top + events[i].viewFields.height) {
          // No more overlaps possible, break out of the loop
          break;
        }
        events[j].viewFields.left = (events[i].viewFields.left || 0) + 42;
      }
    }
  };
  shiftOverlappingEvents(events);

  useEffect(() => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
  
    let upcomingEvent = null;
    if (isToday) {
      for (let i = 0; i < events.length; i++) {
        const currentEvent = events[i];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const currentEventTime = currentEvent.viewFields.hours! * 60 + currentEvent.viewFields.minutes!;
  
        if (!upcomingEvent && currentEventTime >= currentTime) {
          upcomingEvent = currentEvent;
        } else if (upcomingEvent) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const selectedEventTime = upcomingEvent.viewFields.hours! * 60 + upcomingEvent.viewFields.minutes!;
          if (currentEventTime >= currentTime && currentEventTime < selectedEventTime) {
            upcomingEvent = currentEvent;
          }
        }
      }
    } else {
      upcomingEvent = events[0];
    }
  
    const eventToScrollTo = upcomingEvent || events[events.length - 1];
  
    if (eventToScrollTo && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: eventToScrollTo.viewFields.top,
        behavior: "auto"
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, date, is24Hour, view]);

  const TimelineView = () => {
    if (!schedule || isLoading) return (
      <div className="flex items-center justify-center h-[500px]">
        <LoadingSpinner />
      </div>
    );
    return (
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
                      "p-2 mb-2 rounded-md",
                      event.provider === CalendarProvider.goaltime ? "text-white" : "text-background"
                    )}
                    style={{
                      backgroundColor: event.provider === CalendarProvider.goaltime ? event.color : "hsl(var(--accent-foreground))",
                    }}
                  >
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{event.title}</span>
                        {event.subtitle && <span className="text-sm italic">{event.subtitle}</span>}
                        {event.description && <span className="text-sm">{truncateText(event.description, 100)}</span>}
                      </div>
                      { event.provider === CalendarProvider.google && (
                        <div className="pr-1 text-xs">
                          <span className="font-bold">Google</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
  
        {/* Scrollable Timeline */}
        <ScrollArea className="h-[500px] pr-4" scrollRef={scrollRef}>
          <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
            {/* Hour markers and separators */}
            {Array.from({ length: 24 }, (_, i) => (
              <div 
                key={i} 
                className="absolute w-full"
                style={{ top: `${i * HOUR_HEIGHT}px` }}
              >
                <div className="grid grid-cols-[72px_1fr] lg:grid-cols-[84px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground text-nowrap sticky left-0">
                    {formatTime(`${String(i).padStart(2, '0')}:00`)}
                  </span>
                  <Separator className="mt-2" />
                </div>
              </div>
            ))}
  
            {/* Events */}
            <div className="absolute left-[100px] lg:left-[117px] right-0 lg:right-2">
              {events.map((event, index) => {
                const startTime = dayjs.utc(event.event.startTime).tz(timezone);
                const endTime = dayjs.utc(event.event.endTime).tz(timezone);
                return (
                  <Credenza key={event.event.id} open={modalOpen[event.event.id]} onOpenChange={(open) => setModalOpen({ ...modalOpen, [event.event.id]: open })}>
                    <CredenzaTrigger>
                      <div
                        role={event.event.provider === CalendarProvider.goaltime ? "button" : undefined}
                        className={cn(
                          "absolute px-2 mt-2 rounded-md w-[calc(100%-8px)]",
                          event.event.provider === CalendarProvider.goaltime ? "text-white hover:scale-y-105 hover:opacity-95 transition-all duration-150" : "text-background"
                        )}
                        style={{
                          backgroundColor: event.event.provider === CalendarProvider.goaltime ? event.event.color : "hsl(var(--accent-foreground))",
                          top: `${event.viewFields.top}px`,
                          height: `${event.viewFields.height}px`,
                          minHeight: '20px',
                          left: event.viewFields.left
                        }}
                      >
                        <div className="flex justify-between pt-1">
                          <div className="flex flex-col">
                            <span className="text-sm text-left">
                              {event.event.title}
                              {event.viewFields.height < 60 && (
                                <span>, {startTime.format(is24Hour ? 'HH:mm' : 'h:mm A')} - {endTime.format(is24Hour ? 'HH:mm' : 'h:mm A')}</span>
                              )}
                            </span>
                            {/* Show time on second row only if event is more than 60px */}
                            {event.viewFields.height >= 60 && (
                              <span className="text-xs text-left">
                                {startTime.format(is24Hour ? 'HH:mm' : 'h:mm A')} - {endTime.format(is24Hour ? 'HH:mm' : 'h:mm A')}
                              </span>
                            )}
                          </div>
                          { event.event.provider === CalendarProvider.google && (
                            <div className="pr-1 text-xs text-right">
                              <span className="font-bold">Google</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CredenzaTrigger>
                    <EventModal event={event.event} is24Hour={is24Hour} isEditable={event.event.provider === CalendarProvider.goaltime} setOpen={(open) => setModalOpen({ ...modalOpen, [event.event.id]: open })} />
                  </Credenza>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  const ListView = () => {
    if (!schedule || isLoading) return (
      <div className="flex items-center justify-center h-[500px]">
        <LoadingSpinner />
      </div>
    );
    return (
      <ScrollArea className="h-[576px] pt-4 pr-4 w-full">
        {schedule.map(event => {
          const startTime = dayjs(event.startTime);
          const endTime = dayjs(event.endTime);
          return (
            <div
              key={event.id}
              className={cn(
                "flex-shrink-0 px-2 py-1 mb-2 rounded-md",
                event.provider === CalendarProvider.goaltime ? "text-white cursor-pointer hover:scale-y-105 hover:opacity-95 transition-all duration-150" : "text-background"
              )}
              style={{
                backgroundColor: event.provider === CalendarProvider.goaltime ? event.color : "hsl(var(--accent-foreground))",
              }}
            >
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{event.title}</span>
                  {event.subtitle && <span className="text-sm italic">{event.subtitle}</span>}
                  {event.description && <span className="text-xs">{truncateText(event.description, 100)}</span>}
                  {!event.allDay && (
                    <span className="text-xs mt-1">
                      {startTime.format(is24Hour ? 'HH:mm' : 'h:mm A')} - {endTime.format(is24Hour ? 'HH:mm' : 'h:mm A')}
                    </span>
                  )}
                  {event.allDay && <span className="text-sm mt-1">All Day</span>}
                </div>
                { event.provider === CalendarProvider.google && (
                  <div className="text-xs">
                    <span className="font-bold">Google</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </ScrollArea>
    );
  };

  const DateToolbar = ({ className }: { className?: string }) => (
    <div className={className}>
      <Button
        disabled={isLoading}
        variant="outline"
        size="icon"
        onClick={() => navigateDay(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              "hidden md:inline-flex"
            )}
          >
            {format(date, "EEE do MMMM")}
          </Button>
        </PopoverTrigger>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              "md:hidden"
            )}
          >
            {format(date, "dd/MM")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setIsLoading(true);
              setDate(newDate || new Date());
              setCalendarOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button
        disabled={isLoading}
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
        disabled={isLoading}
        variant="outline"
        onClick={() => setIs24Hour(!is24Hour)}
      >
        {is24Hour ? "24h" : "12h"}
      </Button>
      <Button
        disabled={isLoading}
        variant="outline"
        style={{
          backgroundColor: isToday ? "hsl(var(--secondary))" : "hsl(var(--background))",
        }}
        onClick={() => {
          setIsLoading(true);
          setDate(new Date());
        }}
      >
        Today
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={isLoading}
        onClick={() => setView(view === 'timeline' ? 'list' : 'timeline')}
      >
        {view === 'timeline' ? (
          <LayoutList className="h-4 w-4" />
        ) : (
          <CalendarIcon className="h-4 w-4" />
        )}
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                await syncCalendarAction(profile.userId);
                setIsLoading(false);
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh external calendars</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  if (timezone !== profile.timezone && showTimezoneWarning) {
    return (
      <Card className={cn("h-full w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 h-full">
          <p className="text-center text-sm text-muted-foreground">
            Warning: Your profile&apos;s timezone <span className="text-foreground font-bold">({profile.timezone})</span> is different from your current timezone <span className="text-foreground font-bold">({timezone})</span>.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={changeTimezone}
          >
            Change Timezone
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTimezone(profile.timezone);
              setShowTimezoneWarning(false);
            }}
          >
            No, don&apos;t change it
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={cn("h-full w-full", className)}>
      <CardHeader className="flex flex-col items-center gap-2 pt-2 pb-0">
        <CardTitle className="sr-only">Schedule</CardTitle>
        <div className="flex flex-wrap items-center justify-center gap-4 pb-4">
          <DateToolbar className="flex items-center justify-between space-x-2" />
          <ViewToolbar className="flex items-center justify-between space-x-2" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between gap-4 pb-4 px-2 lg:px-4">
        {view === 'timeline' ? <TimelineView /> : <ListView />}
      </CardContent>
    </Card>
  );
};
