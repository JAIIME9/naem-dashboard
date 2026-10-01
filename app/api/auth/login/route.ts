import { NextRequest, NextResponse } from "next/server"

import { createAdminSessionToken, safeEqual } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.NAEM_ADMIN_PASSWORD || ""
  if (!configuredPassword) {
    return NextResponse.json({ ok: false, error: "Acceso no configurado" }, { status: 503 })
  }

  const body = await request.json().catch(() => null) as { password?: string } | null
  const supplied = String(body?.password || "")

  if (!safeEqual(supplied, configuredPassword)) {
    return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 })
  }

  const token = await createAdminSessionToken(configuredPassword)
  const response = NextResponse.json({ ok: true })
  response.cookies.set("naem_admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  return response
}
