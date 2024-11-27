import { z } from 'zod'

const minPasswordMessage = 'Password must be at least 8 characters long'
const maxPasswordMessage = 'Password must be less than 100 characters'
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
  confirmPassword: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
})
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: minPasswordMessage }).max(100, { message: maxPasswordMessage }),
})
