import z from 'zod'

// All zod schemas are used for parsing input data, not defining the database schema.
// Generally, the zod schema will have optional fields with default values 
// that are not optional in the database schema so as to have less null checks
// in the codebase.

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
  }).optional().default('GT User'),
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
  }).optional().default('en'),
  preferredCurrency: z.enum(['USD'], {
    message: 'Please select a valid currency',
  }).optional().default('USD'),
  preferredWakeUpTime: z.date({
    message: 'Please provide a valid date and time',
  }).optional().default(new Date('07:00')),
  preferredSleepTime: z.date({
    message: 'Please provide a valid date and time',
  }).optional().default(new Date('23:00')),
  timezone: z.string({
    message: 'Please provide a valid time zone',
  }).optional().default('America/Los_Angeles'),
})
