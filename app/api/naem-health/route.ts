import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DASHBOARD_WEBHOOK = process.env.NAEM_N8N_DASHBOARD_WEBHOOK || ""
const WEBHOOK_SECRET = process.env.NAEM_WEBHOOK_SECRET || ""

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

export async function GET() {
  const startedAt = Date.now()

  if (!DASHBOARD_WEBHOOK || !WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        stage: "config",
        webhookConfigured: Boolean(DASHBOARD_WEBHOOK),
        secretConfigured: Boolean(WEBHOOK_SECRET),
        error: "Falta configuración del webhook de dashboard en producción",
      },
      { status: 503 },
    )
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    let response: Response
    try {
      response = await fetch(DASHBOARD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-naem-secret": WEBHOOK_SECRET,
        },
        body: JSON.stringify({ healthcheck: true }),
        cache: "no-store",
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const text = await response.text()
    let payload: any = null
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }

    const oportunidades = Array.isArray(payload?.oportunidades)
      ? payload.oportunidades
      : []
    const perfiles = Array.isArray(payload?.perfiles) ? payload.perfiles : []

    return NextResponse.json(
      {
        ok: response.ok && payload?.ok === true,
        stage: response.ok ? "payload" : "webhook_http",
        webhookHttpStatus: response.status,
        payloadOk: payload?.ok === true,
        oportunidades: oportunidades.length,
        perfiles: perfiles.length,
        sample: oportunidades.slice(0, 3).map((o: any) => ({
          empresa: clean(o?.empresa || o?.empresaNombre || o?.["Empresa nombre"]),
          municipio: clean(o?.municipio || o?.Municipio),
          provincia: clean(o?.provincia || o?.Provincia),
          contactoEstado: clean(o?.contactoEstado || o?.contacto_estado || o?.["Contacto estado"]),
          emailPresent: Boolean(clean(o?.emailContacto || o?.email_contacto || o?.["Email contacto"])),
        })),
        durationMs: Date.now() - startedAt,
        rawPrefix: payload ? undefined : text.slice(0, 300),
      },
      { status: response.ok ? 200 : 502 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        stage: "exception",
        error:
          error instanceof Error && error.name === "AbortError"
            ? "Timeout llamando al webhook de n8n"
            : error instanceof Error
              ? error.message
              : "Error desconocido",
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    )
  }
}
