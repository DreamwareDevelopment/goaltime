// Dayjs
import dayjs from 'dayjs'

import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(timezone)
dayjs.extend(utc)

export { dayjs }

export const getTime = (time: string, timezone: string) => {
  return dayjs.tz(`1970-01-01T${time}:00`, timezone)
}
