import { NextRequest, NextResponse } from "next/server"

import { createAdminSessionToken, safeEqual } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next()
  }

  const secret = process.env.NAEM_ADMIN_PASSWORD || ""
  if (!secret) {
    const login = new URL("/login", request.url)
    login.searchParams.set("config", "1")
    return NextResponse.redirect(login)
  }

  const expected = await createAdminSessionToken(secret)
  const current = request.cookies.get("naem_admin_session")?.value || ""

  if (!safeEqual(current, expected)) {
    const login = new URL("/login", request.url)
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
