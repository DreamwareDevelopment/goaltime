import { createClient } from 'jsr:@supabase/supabase-js'

export function getSupabaseClient(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  return supabaseClient
}
