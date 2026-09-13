import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const CONTACT_WEBHOOK =
  process.env.NAEM_N8N_CONTACT_WEBHOOK ||
  "https://naemadmin.app.n8n.cloud/webhook/naem-contact-company-9f4d7c2a6e13b85f"

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
}

export async function POST(request: Request) {
  const contactSecret = process.env.NAEM_N8N_CONTACT_SECRET

  if (!contactSecret) {
    console.error("Falta NAEM_N8N_CONTACT_SECRET en el entorno de producción.")
    return NextResponse.json(
      { error: "El contacto con n8n no está configurado en el servidor." },
      { status: 503 },
    )
  }

  try {
    const payload = await request.json().catch(() => ({}))

    const empresa = clean(payload.empresa)
    const puesto = clean(payload.puesto) || "personal"
    const municipio = clean(payload.municipio)
    const provincia = clean(payload.provincia)
    const email = clean(payload.email).toLowerCase()
    const opportunityKey = clean(
      payload.opportunity_key || payload.opportunityKey,
    )

    if (!empresa) {
      return NextResponse.json(
        { error: "Falta el nombre de la empresa" },
        { status: 400 },
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55_000)

    let response: Response

    try {
      response = await fetch(CONTACT_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-naem-secret": contactSecret,
        },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          empresa,
          puesto,
          municipio,
          provincia,
          email,
          opportunity_key: opportunityKey,
        }),
      })
    } finally {
      clearTimeout(timeout)
    }

    const result = await response.json().catch(() => ({}))

    if (!response.ok || result?.ok !== true) {
      return NextResponse.json(
        {
          error:
            result?.error ||
            "No se pudo localizar un email real y enviar el contacto",
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      ok: true,
      sentTo: result.sentTo,
      empresa: result.empresa || empresa,
      puesto: result.puesto || puesto,
      municipio: result.municipio || municipio,
      emailVerificado: result.emailVerificado === true,
      simulated: false,
      fechaEnvio: result.fechaEnvio || null,
    })
  } catch (error) {
    console.error("Error enviando contacto mediante n8n:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.name === "AbortError"
            ? "La búsqueda del email tardó demasiado. Inténtalo de nuevo."
            : error instanceof Error
              ? error.message
              : "No se pudo enviar el email de contacto",
      },
      { status: 500 },
    )
  }
}
