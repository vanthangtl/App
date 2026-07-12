import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Auth Callback Route
 *
 * Supabase redirect người dùng về đây sau khi họ click link trong email
 * (password reset, magic link, v.v.) kèm theo ?code=xxx trong URL.
 *
 * Route này exchange code lấy session, rồi redirect đến trang đích.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'

  if (!code) {
    // Không có code — redirect về login với lỗi
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const supabaseResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error)
    return NextResponse.redirect(`${origin}/unlock-account?error=link_expired`)
  }

  return supabaseResponse
}
