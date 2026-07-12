import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SESSION_COOKIE = 'app_session_token'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Các route không cần xác thực (public auth pages)
  const publicAuthPaths = ['/login', '/unlock-account', '/reset-password']
  const isPublicAuthPage = publicAuthPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  )

  // /auth/callback phải bypass hoàn toàn — Supabase redirect về đây để exchange code
  // Tại thời điểm này chưa có app_session_token
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  if (!user && !isPublicAuthPage) {
    // Redirect unauthenticated user to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Validate session token for ALL authenticated requests (including auth pages)
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
    const isValidSession = sessionToken
      ? await validateSessionToken(sessionToken, user.id)
      : false

    if (!isValidSession) {
      // Session token missing or revoked — force re-login
      // Exception: /reset-password cần Supabase session nhưng không có app_session_token
      // Đây là trường hợp user vừa click link email mở khóa
      if (request.nextUrl.pathname.startsWith('/reset-password')) {
        return supabaseResponse
      }
      // Clear the stale Supabase auth cookie too so the user can log in cleanly
      return buildLogoutRedirect(request)
    }

    if (isPublicAuthPage) {
      // Authenticated user with a valid session → redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

/**
 * Validates the session token against the DB.
 * Returns false if the token is invalid, revoked, or if a DB error occurs.
 */
async function validateSessionToken(
  sessionToken: string,
  userId: string
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('user_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      // Log for debugging but do NOT block the user on infrastructure errors.
      // If the table doesn't exist yet (migration not run), this will error —
      // in that case we return true to avoid breaking the app.
      if (error.code === '42P01') {
        // 42P01 = table does not exist
        console.warn('[middleware] user_sessions table not found. Run the SQL migration.')
        return true
      }
      console.error('[middleware] Session validation error:', error)
      return true // fail open on unexpected DB errors
    }

    return data !== null
  } catch (err) {
    console.error('[middleware] Unexpected error during session validation:', err)
    return true // fail open
  }
}

/**
 * Builds a redirect response to /login and clears both session cookies.
 * Called when the session token is missing or has been revoked.
 */
function buildLogoutRedirect(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('reason', 'session_revoked')

  const redirectResponse = NextResponse.redirect(url)

  // Clear the app session token cookie
  redirectResponse.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  // Clear Supabase auth cookies so user doesn't get caught in a redirect loop
  // (user authenticated by Supabase but no valid app session_token)
  const supabaseCookieNames = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((name) => name.startsWith('sb-'))

  for (const name of supabaseCookieNames) {
    redirectResponse.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }

  return redirectResponse
}
