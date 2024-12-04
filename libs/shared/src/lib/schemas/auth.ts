import z from 'zod'

const minPasswordMessage = 'Password must be at least 8 characters long'
const maxPasswordMessage = 'Password must be less than 100 characters'
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
  confirmPassword: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
})
SignUpSchema.superRefine((input, ctx) => {
  if (input.password !== input.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] })
  }
})
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
})

export const daysOfTheWeek = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])

export const UserProfileSchema = z.object({
  userId: z.string({
    message: 'User ID is required to create a user profile',
  }),
  avatarUrl: z.string().url({
    message: 'Please provide a valid URL',
  }).default('https://github.com/shadcn.png'),
  name: z.string().max(100, {
    message: 'Could you please be more concise?',
  }),
  birthday: z.date({
    message: 'Please provide a valid date and time',
  }).optional(),
  occupation: z.string().max(100, {
    message: 'Could you please be more concise?',
  }).optional(),
  worksRemotely: z.boolean().default(false),
  daysInOffice: z.array(daysOfTheWeek).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  leavesHomeAt: z.date({
    message: 'Please provide a valid date and time for leavesHomeAt',
  }).optional(), // Default to 8:30 AM after timezone is applied by client
  returnsHomeAt: z.date({
    message: 'Please provide a valid date and time for returnsHomeAt',
  }).optional(), // Default to 5:30 PM after timezone is applied by client
  preferredLanguage: z.enum(['en'], {
    message: 'Please select a supported language',
  }).default('en'),
  preferredCurrency: z.enum(['USD'], {
    message: 'Please select a valid currency',
  }).default('USD'),
  preferredWakeUpTime: z.date({
    message: 'Please provide a valid date and time for preferredWakeUpTime',
  }), // Default to 7:00 AM after timezone is applied by client
  preferredSleepTime: z.date({
    message: 'Please provide a valid date and time for preferredSleepTime',
  }), // Default to 11:00 PM after timezone is applied by client
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
