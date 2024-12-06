import z from 'zod'
import { FieldErrors } from 'react-hook-form'
import { ZodSchemaResolver } from '.'

export const daysOfTheWeek = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])

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
  worksRemotely: z.boolean().default(false),
  daysInOffice: z.array(daysOfTheWeek).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  leavesHomeAt: z.date({
    message: 'Please provide a valid date and time for leavesHomeAt',
  }).nullable().optional().default(null), // Default to 8:30 AM after timezone is applied by client
  returnsHomeAt: z.date({
    message: 'Please provide a valid date and time for returnsHomeAt',
  }).nullable().optional().default(null), // Default to 5:30 PM after timezone is applied by client
  preferredLanguage: z.enum(['en'], {
    message: 'Please select a supported language',
  }).default('en'),
  preferredCurrency: z.enum(['USD'], {
    message: 'Please select a valid currency',
  }).default('USD'),
  preferredWakeUpTime: z.date({
    message: 'Please provide a valid date and time for preferredWakeUpTime',
  }).nullable().optional().default(null), // Default to 7:00 AM after timezone is applied by client
  preferredSleepTime: z.date({
    message: 'Please provide a valid date and time for preferredSleepTime',
  }).nullable().optional().default(null), // Default to 11:00 PM after timezone is applied by client
  timezone: z.string({
    message: 'Please provide a valid time zone',
  }), // Populated by client on load, but can be changed by user
})
export type UserProfileInput = z.infer<typeof UserProfileSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const refineUserProfileSchema: ZodSchemaResolver<UserProfileInput, any> = async (input: UserProfileInput) => {
  const errors: FieldErrors<UserProfileInput> = {}
  if (!input.worksRemotely) {
    if (!input.leavesHomeAt) {
      errors.leavesHomeAt = {
        type: 'validate',
        message: 'You must specify the time you normally leave home if you are not working remotely',
      }
    }
    if (!input.returnsHomeAt) {
      errors.returnsHomeAt = {
        type: 'validate',
        message: 'You must specify the time you normally return home if you are not working remotely',
      }
    }
    if (input.leavesHomeAt && input.returnsHomeAt && input.leavesHomeAt >= input.returnsHomeAt) {
      errors.returnsHomeAt = {
        type: 'validate',
        message: 'You cannot return home before you leave home',
      }
    }
    if (input.daysInOffice.length === 0) {
      errors.daysInOffice = {
        type: 'validate',
        message: 'Must have at least one day in office if not working remotely',
      }
    }
  }
  return errors
}
