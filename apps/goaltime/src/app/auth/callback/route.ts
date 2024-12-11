import { NextResponse } from 'next/server'
import { createClient } from '@/server-utils/supabase'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'
  const forwardedHost = request.headers.get('x-forwarded-host') // proxy url or site url

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Error exchanging code for session', error)
    }
  }

  // return the user to an error page with instructions
  const message = encodeURIComponent(code ? 'Error exchanging code for session' : 'No code provided')
  const solution = encodeURIComponent('Please try again or contact support if the problem persists.')
  const nextPath = encodeURIComponent('/login')
  const redirectUrl = forwardedHost ? `https://${forwardedHost}` : `${origin}`
  return NextResponse.redirect(`${redirectUrl}/error?message=${message}&solution=${solution}&next=${nextPath}`)
}
