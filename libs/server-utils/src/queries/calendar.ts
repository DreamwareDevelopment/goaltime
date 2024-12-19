import { User } from "@prisma/client";

import { CalendarEvent } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma/client';
import { dayjs } from "@/shared/utils";

export async function getSchedule(userId: User['id'], date: dayjs.Dayjs, timezone: string): Promise<CalendarEvent[]> {
  const startOfDay = date.startOf('day').toDate()
  const endOfDay = date.endOf('day').toDate()
  const prisma = await getPrismaClient(userId);
  const schedule = await prisma.calendarEvent.findMany({
    where: {
      userId,
      OR: [
        {
          startTime: {
            gte: startOfDay,
          },
          endTime: {
            lte: endOfDay,
          },
        },
        {
          allDay: {
            gte: startOfDay,
            lte: endOfDay,
          },
        }
      ],
    },
  });
  return schedule;
}
