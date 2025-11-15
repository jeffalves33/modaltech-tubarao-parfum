// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
    // resposta padrão
    const res = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // importante: escrever o cookie na resposta
                    res.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    res.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data, error } = await supabase.auth.getUser()
    const user = data?.user
    const { pathname } = req.nextUrl

    const isAuthRoute = pathname.startsWith('/login')

    if (!user && !isAuthRoute) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    if (user && isAuthRoute) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/'
        redirectUrl.searchParams.delete('from')
        return NextResponse.redirect(redirectUrl)
    }

    return res
}

// Define em quais rotas o middleware roda
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|images/).*)',],
}
