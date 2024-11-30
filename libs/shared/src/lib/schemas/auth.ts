import z from 'zod'

const minPasswordMessage = 'Password must be at least 8 characters long'
const maxPasswordMessage = 'Password must be less than 100 characters'
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
  confirmPassword: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
})
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
})

export const UserProfileSchema = z.object({
  userId: z.string({
    message: 'User ID is required to create a user profile',
  }),
  avatarUrl: z.string().url({
    message: 'Please provide a valid URL',
  }).optional(),
  name: z.string().max(100, {
    message: 'Could you please be more concise?',
  }),
  birthDate: z.date({
    message: 'Please provide a valid date and time',
  }).optional(),
  occupation: z.string().max(100, {
    message: 'Could you please be more concise?',
  }).optional(),
  weeklyWorkHours: z.number().min(0, {
      message: "You're not a time traveler, right?",
    }).max(168, {
      message: 'Sorry, but no one works that much!',
    }).optional().default(40),
  preferredLanguage: z.enum(['en'], {
    message: 'Please select a supported language',
  }).default('en'),
  preferredCurrency: z.enum(['USD'], {
    message: 'Please select a valid currency',
  }).default('USD'),
  preferredWakeUpTime: z.date({
    message: 'Please provide a valid date and time',
  }), // Default to 7:00 AM after timezone is applied by client
  preferredSleepTime: z.date({
    message: 'Please provide a valid date and time',
  }), // Default to 11:00 PM after timezone is applied by client
  timezone: z.string({
    message: 'Please provide a valid time zone',
  }), // Populated by client on load, but can be changed by user
})
export type UserProfileInput = z.infer<typeof UserProfileSchema>