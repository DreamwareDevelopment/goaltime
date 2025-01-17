import { CalendarEvent } from "@prisma/client"
import { DATE_TIME_FORMAT, dayjs } from "@/shared/utils"

export function formatEvent(event: CalendarEvent): string {
  const startTime = event.startTime ? dayjs(event.startTime) : null
  const endTime = event.endTime ? dayjs(event.endTime) : null
  const duration = endTime ? endTime.diff(startTime, "minutes") : null
  return `{
    "title": "${event.title}",
    "description": "${event.description}",
    "startTime": "${startTime ? startTime.format(DATE_TIME_FORMAT) : null}",
    "endTime": "${endTime ? endTime.format(DATE_TIME_FORMAT) : null}",
    "duration": "${duration ? `${duration} mins` : null}",
  }`
}

export function formatEvents(events: CalendarEvent[]): string {
  return JSON.stringify(events.map(formatEvent), null, 2)
}
