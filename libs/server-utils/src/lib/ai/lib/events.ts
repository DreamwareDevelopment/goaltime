import { CalendarEvent } from "@prisma/client"
import { DATE_TIME_FORMAT, dayjs } from "@/shared/utils"
import { Jsonify } from "inngest/helpers/jsonify"

export type LLMEvent = {
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  duration: string | null
}

export function formatEvent(event: CalendarEvent | Jsonify<CalendarEvent>, timezone: string): LLMEvent {
  const startTime = event.startTime ? dayjs(event.startTime).tz(timezone) : null
  const endTime = event.endTime ? dayjs(event.endTime).tz(timezone) : null
  const duration = endTime ? endTime.diff(startTime, "minutes") : null
  return {
    title: event.title,
    description: event.description,
    startTime: startTime ? startTime.format(DATE_TIME_FORMAT) : null,
    endTime: endTime ? endTime.format(DATE_TIME_FORMAT) : null,
    duration: duration ? `${duration} mins` : null,
  }
}

export function formatEvents(events: Array<CalendarEvent | Jsonify<CalendarEvent>>, timezone: string) {
  return events.map(event => formatEvent(event, timezone))
}
