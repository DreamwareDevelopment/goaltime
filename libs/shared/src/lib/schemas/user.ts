import z from 'zod'
import { FieldErrors } from 'react-hook-form'
import { getDefaults, ZodSchemaResolver } from '.'
import { dayjs } from '../utils'
import { UserProfile } from '@prisma/client'
import { ExternalEvent } from '../types/scheduling'

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

export function getProfileRoutine(profile: UserProfile): RoutineActivities {
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
        entry.Everyday = { ...entry.Monday }
        entry.Weekdays = { ...entry.Monday }
        entry.Weekends = { ...entry.Saturday }

        for (const day in entry) {
          const dayKey = day as RoutineDay
          const dayEntry = entry[dayKey]
          routine.custom[key][dayKey] = {
            ...dayEntry,
            start: dayEntry.start ? dayjs(dayEntry.start).toDate() : null,
            end: dayEntry.end ? dayjs(dayEntry.end).toDate() : null,
          }
        }
      }
      continue
    }
    const key = activity as RoutineActivity
    routine[key] = getDefaults(RoutineDaysSchema)
    const entry = parsed[key];
    if (!entry) {
      throw new Error(`No entry found for ${key}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entry.Everyday = { ...entry.Monday! }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entry.Weekdays = { ...entry.Monday! }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entry.Weekends = { ...entry.Saturday! }
  
    for (const day in entry) {
      const dayKey = day as RoutineDay
      const dayEntry = entry[dayKey] as Routine
      routine[key][dayKey] = {
        ...dayEntry,
        start: dayEntry.start ? dayjs(dayEntry.start).toDate() : null,
        end: dayEntry.end ? dayjs(dayEntry.end).toDate() : null,
      }
    }
  }
  return routine
}

export function routineToExternalEvents(routine: RoutineActivities, date?: dayjs.Dayjs): Record<DaysOfTheWeekType, ExternalEvent<dayjs.Dayjs>[]> {
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
      events[day].push({
        id: activity,
        title: activity.charAt(0).toUpperCase() + activity.slice(1),
        start: date ? dayjs(routine.start).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.start),
        end: date ? dayjs(routine.end).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.end),
      });
    }
  }
  for (const activity in routine.custom) {
    const routineDays = routine.custom[activity];
    for (const day of Object.values(daysOfTheWeek.Values)) {
      const routine = routineDays[day] as Routine;
      events[day].push({
        id: activity,
        title: activity,
        start: date ? dayjs(routine.start).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.start),
        end: date ? dayjs(routine.end).year(date.year()).month(date.month()).date(date.date()) : dayjs(routine.end),
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
