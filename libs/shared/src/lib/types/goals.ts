import { Prisma } from "@prisma/client"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const goalWithNotifications = Prisma.validator<Prisma.GoalArgs>()({
  include: { notifications: true },
})

export type GoalWithNotifications = Prisma.GoalGetPayload<typeof goalWithNotifications>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const goalWithNotificationsAndCalendarEvents = Prisma.validator<Prisma.GoalArgs>()({
  include: { notifications: true, calendarEvents: true },
})

export type GoalWithNotificationsAndCalendarEvents = Prisma.GoalGetPayload<typeof goalWithNotificationsAndCalendarEvents>
