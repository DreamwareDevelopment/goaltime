import deepEqual from 'fast-deep-equal'
import z from 'zod'
import { FieldErrors } from 'react-hook-form'
import { getDefaults, ZodSchemaResolver } from '.'
import { dayjs } from '../utils'
import { UserProfile } from '@prisma/client'
import { ExternalEvent, Interval } from '../types/scheduling'
import { Jsonify } from 'inngest/helpers/jsonify'
import { DATE_TIME_FORMAT } from '../constants'

export const daysOfTheWeek = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
export type DaysOfTheWeekType = z.infer<typeof daysOfTheWeek>

export const DaysSelectionEnum = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday', 'Weekdays', 'Weekends'])
export type DaysSelectionEnumType = z.infer<typeof DaysSelectionEnum>

export const SupportedLanguages = z.enum(['en'])
export type SupportedLanguagesType = z.infer<typeof SupportedLanguages>

export const SupportedCurrencies = z.enum(['USD'])
export type SupportedCurrenciesType = z.infer<typeof SupportedCurrencies>

export const RoutineSchema = z.object({
  start: z.date().nullable().default(null),
  end: z.date().nullable().default(null),
})

export type Routine = z.infer<typeof RoutineSchema>

export const SerializedRoutineSchema = z.object({
  start: z.string().nullable().default(null),
  end: z.string().nullable().default(null),
})

export type SerializedRoutine = z.infer<typeof SerializedRoutineSchema>

export const RoutineDaysSchema = z.object({
  Everyday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Weekdays: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Weekends: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Monday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Tuesday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Wednesday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Thursday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Friday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Saturday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
  Sunday: RoutineSchema.optional().default(getDefaults(RoutineSchema)),
})

export type RoutineDays = z.infer<typeof RoutineDaysSchema>

export type RoutineDay = keyof RoutineDays;

export const SerializedRoutineDaysSchema = z.object({
  Everyday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Weekdays: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Weekends: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Monday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Tuesday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Wednesday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Thursday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Friday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Saturday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
  Sunday: SerializedRoutineSchema.optional().default(getDefaults(SerializedRoutineSchema)),
})

export type SerializedRoutineDays = z.infer<typeof SerializedRoutineDaysSchema>

export const OptionalRoutineSchema = RoutineSchema.extend({
  skip: z.boolean().default(false),
})

export type OptionalRoutine = z.infer<typeof OptionalRoutineSchema>

export const SerializedOptionalRoutineSchema = SerializedRoutineSchema.extend({
  skip: z.boolean().default(false),
})

export type SerializedOptionalRoutine = z.infer<typeof SerializedOptionalRoutineSchema>

export const OptionalRoutineDaysSchema = z.object({
  Everyday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Weekdays: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Weekends: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Monday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Tuesday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Wednesday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Thursday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Friday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Saturday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
  Sunday: OptionalRoutineSchema.optional().default(getDefaults(OptionalRoutineSchema)),
})

export type OptionalRoutineDays = z.infer<typeof OptionalRoutineDaysSchema>

export const SerializedOptionalRoutineDaysSchema = z.object({
  Everyday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Weekdays: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Weekends: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Monday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Tuesday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Wednesday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Thursday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Friday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Saturday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
  Sunday: SerializedOptionalRoutineSchema.optional().default(getDefaults(SerializedOptionalRoutineSchema)),
})

export type SerializedOptionalRoutineDays = z.infer<typeof SerializedOptionalRoutineDaysSchema>

export const RoutineActivitiesSchema = z.object({
  sleep: RoutineDaysSchema,
  breakfast: OptionalRoutineDaysSchema,
  lunch: OptionalRoutineDaysSchema,
  dinner: OptionalRoutineDaysSchema,
  custom: z.record(z.string(), OptionalRoutineDaysSchema).optional().default({}),
}).default({
  sleep: getDefaults(RoutineDaysSchema),
  breakfast: getDefaults(OptionalRoutineDaysSchema),
  lunch: getDefaults(OptionalRoutineDaysSchema),
  dinner: getDefaults(OptionalRoutineDaysSchema),
  custom: {},
})

export type RoutineActivities = z.infer<typeof RoutineActivitiesSchema>

export const SerializedRoutineActivitiesSchema = z.object({
  sleep: SerializedRoutineDaysSchema,
  breakfast: SerializedOptionalRoutineDaysSchema,
  lunch: SerializedOptionalRoutineDaysSchema,
  dinner: SerializedOptionalRoutineDaysSchema,
  custom: z.record(z.string(), SerializedOptionalRoutineDaysSchema.optional()).optional().default({}),
})

export type SerializedRoutineActivities = z.infer<typeof SerializedRoutineActivitiesSchema>

export type RoutineActivity = keyof RoutineActivities;

export function formatRoutine(profile: UserProfile | Jsonify<UserProfile>): SerializedRoutineActivities {
  const parsed = SerializedRoutineActivitiesSchema.parse(profile.routine)
  for (const activity in parsed) {
    if (activity === 'custom') {
      for (const key in parsed.custom) {
        for (const day in parsed.custom[key]) {
          const dayEntry = parsed.custom[key][day as RoutineDay]
          const start = dayEntry.start ? dayjs(dayEntry.start).tz(profile.timezone).format(DATE_TIME_FORMAT) : null
          const end = dayEntry.end ? dayjs(dayEntry.end).tz(profile.timezone).format(DATE_TIME_FORMAT) : null
          parsed.custom[key][day as RoutineDay] = {
            ...dayEntry,
            start,
            end,
          }
        }
      }
    } else {
      for (const day in parsed[activity as RoutineActivity]) {
        const dayEntry = parsed[activity as RoutineActivity][day as RoutineDay] as Routine
        const start = dayEntry.start ? dayjs(dayEntry.start).tz(profile.timezone).format(DATE_TIME_FORMAT) : null
        const end = dayEntry.end ? dayjs(dayEntry.end).tz(profile.timezone).format(DATE_TIME_FORMAT) : null
        parsed[activity as RoutineActivity][day as RoutineDay] = {
          ...dayEntry,
          start,
          end,
        }
      }
    }
  }
  return parsed
}

export function getProfileRoutine(profile: UserProfile, excludeSkipped = true): RoutineActivities {
  const parsed = SerializedRoutineActivitiesSchema.parse(profile.routine)
  if (!parsed.sleep || !parsed.breakfast || !parsed.lunch || !parsed.dinner) {
    throw new Error('No routine found')
  }
  const routine: RoutineActivities = {
    custom: {},
  } as RoutineActivities
  for (const activity in parsed) {
    if (activity === 'custom') {
      for (const key in parsed.custom) {
        routine.custom[key] = getDefaults(RoutineDaysSchema)
        const entry = parsed.custom[key];
        if (!entry) {
          throw new Error(`No entry found for ${key}`)
        }
        // Set up individual days first
        for (const day in entry) {
          const dayKey = day as RoutineDay
          const dayEntry = entry[dayKey]
          if (excludeSkipped && dayEntry.start === null && dayEntry.end === null) {
            continue;
          }
          routine.custom[key][dayKey] = {
            ...dayEntry,
            start: dayEntry.start ? dayjs(dayEntry.start).tz(profile.timezone).toDate() : null,
            end: dayEntry.end ? dayjs(dayEntry.end).tz(profile.timezone).toDate() : null,
          }
        }
        // Then set up aggregate days
        routine.custom[key].Everyday = { ...routine.custom[key].Monday }
        routine.custom[key].Weekdays = { ...routine.custom[key].Monday }
        routine.custom[key].Weekends = { ...routine.custom[key].Saturday }
      }
      continue
    }
    const key = activity as RoutineActivity
    routine[key] = getDefaults(RoutineDaysSchema)
    const entry = parsed[key];
    if (!entry) {
      throw new Error(`No entry found for ${key}`)
    }
    // Set up individual days first
    for (const day in entry) {
      const dayKey = day as RoutineDay
      const dayEntry = entry[dayKey] as Routine
      if (excludeSkipped && dayEntry.start === null && dayEntry.end === null) {
        continue;
      }
      routine[key][dayKey] = {
        ...dayEntry,
        start: dayEntry.start ? dayjs(dayEntry.start).tz(profile.timezone).toDate() : null,
        end: dayEntry.end ? dayjs(dayEntry.end).tz(profile.timezone).toDate() : null,
      }
    }
    // Then set up aggregate days
    routine[key].Everyday = { ...routine[key].Monday }
    routine[key].Weekdays = { ...routine[key].Monday }
    routine[key].Weekends = { ...routine[key].Saturday }
  }
  return routine
}

export function getSleepRoutineForDay(routine: RoutineActivities, date: dayjs.Dayjs): Interval<dayjs.Dayjs> {
  console.log(`Getting sleep routine for ${date.format(DATE_TIME_FORMAT)}`)
  const todayName = date.format('dddd') as DaysOfTheWeekType;
  const todayRoutine = routine.sleep[todayName];
  const end = dayjs(todayRoutine.end).year(date.year()).month(date.month()).date(date.date());
  let start = dayjs(todayRoutine.start).year(date.year()).month(date.month()).date(date.date());
  if (start.hour() >= 0 && start.hour() < end.hour()) {
    start = start.add(1, 'day');
  }
  return {
    start,
    end,
  }
}

export function getDefaultRoutineDisplayTab(times: RoutineDays, debug = false): "Everyday" | "Weekly" | "Custom" {
  let lastRoutine: Routine | null = null
  let isEveryday = true
  let isWeekly = true

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const weekends = ["Saturday", "Sunday"]

  let weekdayRoutine: Routine | null = null
  let weekendRoutine: Routine | null = null

  let hasSetWeekdayRoutine = false
  let hasSetWeekendRoutine = false
  let hasSetLastRoutine = false

  for (const key in times) {
    if (key === 'Everyday' || key === 'Weekdays' || key === 'Weekends') {
      continue;
    }
    const routine = times[key as keyof RoutineDays]

    if (debug) {
      console.log(`key: ${key}`)
      console.log(`routine: ${JSON.stringify(routine, null, 2)}`)
      console.log(`lastRoutine: ${JSON.stringify(lastRoutine, null, 2)}`)
      console.log(`deepEqual: ${deepEqual(lastRoutine, routine)}`)
    }
    if (!hasSetLastRoutine) {
      lastRoutine = routine
      hasSetLastRoutine = true
    } else if (isEveryday && !deepEqual(lastRoutine, routine)) {
      isEveryday = false
      if (debug) {
        console.log(`isEveryday: ${isEveryday}`)
      }
    }

    if (weekdays.includes(key)) {
      if (!hasSetWeekdayRoutine) {
        weekdayRoutine = routine
        hasSetWeekdayRoutine = true
      } else if (isWeekly && !deepEqual(weekdayRoutine, routine)) {
        isWeekly = false
        if (debug) {
          console.log(`isWeekly: ${isWeekly}`)
        }
      }
    } else if (weekends.includes(key)) {
      if (!hasSetWeekendRoutine) {
        weekendRoutine = routine
        hasSetWeekendRoutine = true
      } else if (isWeekly && !deepEqual(weekendRoutine, routine)) {
        isWeekly = false
        if (debug) {
          console.log(`isWeekly: ${isWeekly}`)
        }
      }
    }
    if (weekends.includes(key)) {
      weekendRoutine = routine
    } else {
      weekdayRoutine = routine
    }
    lastRoutine = routine
  }

  if (isEveryday) {
    return "Everyday"
  }

  if (isWeekly && weekdayRoutine && weekendRoutine && !deepEqual(weekdayRoutine, weekendRoutine)) {
    return "Weekly"
  }

  return "Custom"
}

export function routineToExternalEvents(routine: RoutineActivities, timezone: string, date?: dayjs.Dayjs): Record<DaysOfTheWeekType, ExternalEvent<dayjs.Dayjs>[]> {
  const events: Record<DaysOfTheWeekType, ExternalEvent<dayjs.Dayjs>[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };
  for (const activity in routine) {
    if (activity === 'sleep' || activity === 'custom') {
      continue;
    }
    const routineDays = routine[activity as RoutineActivity];
    for (const day of Object.values(daysOfTheWeek.Values)) {
      const routine = routineDays[day] as Routine;
      if (routine.start === null && routine.end === null) {
        continue;
      }
      const start = date ? dayjs(routine.start).tz(timezone).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.start).tz(timezone);
      const end = date ? dayjs(routine.end).tz(timezone).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.end).tz(timezone);
      events[day].push({
        id: activity,
        title: activity.charAt(0).toUpperCase() + activity.slice(1),
        start,
        end,
      });
    }
  }
  for (const activity in routine.custom) {
    const routineDays = routine.custom[activity];
    for (const day of Object.values(daysOfTheWeek.Values)) {
      const routine = routineDays[day] as Routine;
      if (routine.start === null && routine.end === null) {
        continue;
      }
      const start = date ? dayjs(routine.start).tz(timezone).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.start).tz(timezone);
      const end = date ? dayjs(routine.end).tz(timezone).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.end).tz(timezone);
      events[day].push({
        id: activity,
        title: activity,
        start,
        end,
      });
    }
  }
  return events;
}

export const UserProfileSchema = z.object({
  userId: z.string({
    message: 'User ID is required to create a user profile',
  }),
  avatarUrl: z.string({
    message: 'Please provide a valid URL',
  }).default('https://github.com/shadcn.png'),
  name: z.string().max(100, {
    message: 'Could you please be more concise?',
  }),
  phone: z.string().regex(/^\+\d{1,2}\d{10}$/, {
    message: 'Please provide a valid phone number',
  }),
  otp: z.string().optional(),
  email: z.string().email({
    message: 'Please provide a valid email address',
  }),
  birthday: z.date({
    message: 'Please provide a valid birthday',
  }).min(new Date('1900-01-01'), {
    message: 'Please provide a valid birthday',
  }).max(new Date(), {
    message: 'Please provide a valid birthday',
  }).nullable().optional().default(null),
  occupation: z.string().max(100, {
    message: 'Could you please be more concise?',
  }).nullable().optional().default(null),
  hasOnboarded: z.boolean().default(false),
  unemployed: z.boolean().default(false),
  workDays: z.array(daysOfTheWeek).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  startsWorkAt: z.date({
    message: 'Please provide a valid date and time for startsWorkAt',
  }).nullable().optional().default(null), // Default to 8:30 AM after timezone is applied by client
  endsWorkAt: z.date({
    message: 'Please provide a valid date and time for endsWorkAt',
  }).nullable().optional().default(null), // Default to 5:30 PM after timezone is applied by client
  preferredLanguage: SupportedLanguages.default('en'),
  preferredCurrency: SupportedCurrencies.default('USD'),
  routine: RoutineActivitiesSchema.default({
    sleep: getDefaults(RoutineDaysSchema),
    breakfast: getDefaults(OptionalRoutineDaysSchema),
    lunch: getDefaults(OptionalRoutineDaysSchema),
    dinner: getDefaults(OptionalRoutineDaysSchema),
    custom: {},
  }),
  timezone: z.string({
    message: 'Please provide a valid time zone',
  }), // Populated by client on load, but can be changed by user
})
export type UserProfileInput = z.infer<typeof UserProfileSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const refineUserProfileSchema: ZodSchemaResolver<UserProfileInput, any> = async (input: UserProfileInput) => {
  const errors: FieldErrors<UserProfileInput> = {}
  if (!input.unemployed) {
    if (!input.startsWorkAt) {
      errors.startsWorkAt = {
        type: 'validate',
        message: 'You must specify the time you normally start work if you have a job',
      }
    }
    if (!input.endsWorkAt) {
      errors.endsWorkAt = {
        type: 'validate',
        message: 'You must specify the time you normally end work if you have a job',
      }
    }
    if (input.startsWorkAt && input.endsWorkAt && input.startsWorkAt >= input.endsWorkAt) {
      errors.endsWorkAt = {
        type: 'validate',
        message: 'You cannot return home before you leave home',
      }
    }
    if (input.workDays.length === 0) {
      errors.workDays = {
        type: 'validate',
        message: 'Must have at least one day in office if not working remotely',
      }
    }
  }
  return errors
}

export function deserializeUserProfile(profile: Jsonify<UserProfile>): UserProfile {
  return {
    ...profile,
    birthday: profile.birthday ? dayjs(profile.birthday).toDate() : null,
    startsWorkAt: profile.startsWorkAt ? dayjs(profile.startsWorkAt).toDate() : null,
    endsWorkAt: profile.endsWorkAt ? dayjs(profile.endsWorkAt).toDate() : null,
  }
}
