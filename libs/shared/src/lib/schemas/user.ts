import z from 'zod'

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
    message: 'Please provide a valid date and time',
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
UserProfileSchema.superRefine((input, ctx) => {
  if (!input.worksRemotely) {
    if (!input.leavesHomeAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must specify the time you normally leave home if you are not working remotely',
        path: ['leavesHomeAt'],
      })
    }
    if (!input.returnsHomeAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must specify the time you normally return home if you are not working remotely',
        path: ['returnsHomeAt'],
      })
    }
    if (input.leavesHomeAt && input.returnsHomeAt && input.leavesHomeAt >= input.returnsHomeAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You cannot return home before you leave home',
        path: ['returnsHomeAt'],
      })
    }
    if (input.daysInOffice.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must have at least one day in office if not working remotely',
        path: ['daysInOffice'],
      })
    }
  }
})
export type UserProfileInput = z.infer<typeof UserProfileSchema>
