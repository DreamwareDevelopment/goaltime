import { User } from "@supabase/supabase-js";

export type SanitizedUser = Pick<User, 'id' | 'email'>
