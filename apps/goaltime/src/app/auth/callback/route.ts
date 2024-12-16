import { NextResponse } from 'next/server'
import { createClient } from '@/server-utils/supabase'
import { getPrismaClient } from '@/server-utils/prisma'
import { Session, User } from '@supabase/supabase-js'
import { inngest, InngestEvent } from '@/server-utils/inngest'

// Opt out of caching; every request should send a new event
export const dynamic = 'force-dynamic'

async function saveGoogleAuthTokens(session: Session, user: User) {
  const accessToken = session.access_token
  const refreshToken = session.provider_refresh_token
  if (!accessToken || !refreshToken) {
    throw new Error('No access token or refresh token provided')
  }
  // This will cause a postgres trigger to fire a background function to sync the calendar
  const prisma = await getPrismaClient()
  const googleAuth = await prisma.googleAuth.create({
    data: {
      userId: user.id,
      accessToken,
      refreshToken,
    }
  })
  await inngest.send({
    name: InngestEvent.GoogleCalendarInit,
    data: googleAuth,
  })
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'
  const forwardedHost = request.headers.get('x-forwarded-host') // proxy url or site url

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (data?.session && data.user) {
      try {
        await saveGoogleAuthTokens(data.session, data.user)
      } catch (e) {
        const errorMessage = 'Error saving Google auth tokens'
        const solutionMessage = 'Please try again or contact support if the problem persists.'
        const nextPath = '/login'
        console.error(errorMessage, e)
        return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent(errorMessage)}&solution=${encodeURIComponent(solutionMessage)}&next=${encodeURIComponent(nextPath)}`)
      }
    }

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
