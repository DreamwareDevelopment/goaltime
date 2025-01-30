import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export interface TokenInfo {
  accessToken: string
  expiresAt?: number
  refreshToken: string
}

export async function getTokenInfo(): Promise<TokenInfo> {
  const supabase = await createClient()
  const session = await supabase.auth.getSession()
  if (!session.data.session) {
    throw new Error('No session found')
  }
  return {
    accessToken: session.data.session.access_token,
    expiresAt: session.data.session.expires_at,
    refreshToken: session.data.session.refresh_token,
  }
}

export async function refreshTokenIfNeeded(tokenInfo: TokenInfo): Promise<TokenInfo> {
  if (tokenInfo.expiresAt && tokenInfo.expiresAt < Date.now() / 1000) {
    console.log('Refreshing token...')
    const supabase = await createClient()
    const refreshedSession = await supabase.auth.refreshSession({
      refresh_token: tokenInfo.refreshToken,
    })
    if (!refreshedSession.data.session) {
      throw new Error('Failed to refresh')
    }
    return {
      accessToken: refreshedSession.data.session.access_token,
      expiresAt: refreshedSession.data.session.expires_at,
      refreshToken: refreshedSession.data.session.refresh_token,
    }
  }
  return tokenInfo
}
