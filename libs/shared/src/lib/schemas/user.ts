import z from 'zod'
import { FieldErrors } from 'react-hook-form'
import { getDefaults, ZodSchemaResolver } from '.'

export const daysOfTheWeek = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
export type DaysOfTheWeekType = z.infer<typeof daysOfTheWeek>

export const DaysSelectionEnum = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday', 'Weekdays', 'Weekends'])
export type DaysSelectionEnumType = z.infer<typeof DaysSelectionEnum>

export const SupportedLanguages = z.enum(['en'])
export type SupportedLanguagesType = z.infer<typeof SupportedLanguages>

export const SupportedCurrencies = z.enum(['USD'])
export type SupportedCurrenciesType = z.infer<typeof SupportedCurrencies>

export const RoutineSchema = z.object({
  day: DaysSelectionEnum.default('Everyday'),
  wakeUpTime: z.date({
    message: 'Please provide a valid date and time for wakeUpTime',
  }).nullable().default(null),
  sleepTime: z.date({
    message: 'Please provide a valid date and time for sleepTime',
  }).nullable().default(null),
  breakfastStart: z.date({
    message: 'Please provide a valid date and time for breakfastStart',
  }).nullable().default(null),
  breakfastEnd: z.date({
    message: 'Please provide a valid date and time for breakfastEnd',
  }).nullable().default(null),
  lunchStart: z.date({
    message: 'Please provide a valid date and time for lunchStart',
  }).nullable().default(null),
  lunchEnd: z.date({
    message: 'Please provide a valid date and time for lunchEnd',
  }).nullable().default(null),
  dinnerStart: z.date({
    message: 'Please provide a valid date and time for dinnerStart',
  }).nullable().default(null),
  dinnerEnd: z.date({
    message: 'Please provide a valid date and time for dinnerEnd',
  }).nullable().default(null),
})

export type Routine = z.infer<typeof RoutineSchema>

export const RoutineDaysSchema = z.object({
  Everyday: RoutineSchema.optional(),
  Weekdays: RoutineSchema.optional(),
  Weekends: RoutineSchema.optional(),
  Monday: RoutineSchema.optional(),
  Tuesday: RoutineSchema.optional(),
  Wednesday: RoutineSchema.optional(),
  Thursday: RoutineSchema.optional(),
  Friday: RoutineSchema.optional(),
  Saturday: RoutineSchema.optional(),
  Sunday: RoutineSchema.optional(),
})

export type RoutineDays = z.infer<typeof RoutineDaysSchema>

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
  phone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/, {
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
  routine: RoutineDaysSchema.default({
    Everyday: getDefaults(RoutineSchema),
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
