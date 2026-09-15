import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const CONTACT_WEBHOOK = process.env.NAEM_N8N_CONTACT_WEBHOOK || ""
const DASHBOARD_WEBHOOK = process.env.NAEM_N8N_DASHBOARD_WEBHOOK || ""
const CONTACT_SECRET = process.env.NAEM_WEBHOOK_SECRET || ""

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

type DashboardOpportunity = {
  empresa?: string
  titulo?: string
  oportunidad?: string
  perfilDetectado?: string
  municipio?: string
  provincia?: string
  opportunityKey?: string
}

async function resolveOpportunity(
  empresa: string,
  puesto: string,
  municipio: string,
): Promise<DashboardOpportunity | null> {
  if (!DASHBOARD_WEBHOOK) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12_000)

    let response: Response
    try {
      response = await fetch(DASHBOARD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-naem-secret": CONTACT_SECRET,
        },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({}),
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) return null
    const data = await response.json().catch(() => ({}))
    const oportunidades = Array.isArray(data?.oportunidades)
      ? (data.oportunidades as DashboardOpportunity[])
      : []

    const empresaNorm = normalize(empresa)
    const municipioNorm = normalize(municipio)
    const puestoNorm = normalize(puesto)

    const candidatas = oportunidades.filter((o) => {
      if (normalize(o.empresa) !== empresaNorm) return false
      if (municipioNorm && normalize(o.municipio) !== municipioNorm) return false
      return true
    })

    if (candidatas.length === 0) return null

    const porPuesto = candidatas.find((o) => {
      const textos = [o.titulo, o.perfilDetectado, o.oportunidad]
        .map(normalize)
        .filter(Boolean)
      return textos.some(
        (texto) =>
          texto === puestoNorm ||
          texto.includes(puestoNorm) ||
          puestoNorm.includes(texto),
      )
    })

    return porPuesto || candidatas[0]
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    if (!CONTACT_WEBHOOK || !CONTACT_SECRET) {
      return NextResponse.json(
        { error: "La conexión con n8n aún no está configurada en producción" },
        { status: 503 },
      )
    }

    const payload = await request.json().catch(() => ({}))

    const empresa = clean(payload.empresa)
    const puesto = clean(payload.puesto) || "personal"
    const municipio = clean(payload.municipio)
    let provincia = clean(payload.provincia)
    const email = clean(payload.email).toLowerCase()
    let opportunityKey = clean(payload.opportunity_key || payload.opportunityKey)

    if (!empresa) {
      return NextResponse.json(
        { error: "Falta el nombre de la empresa" },
        { status: 400 },
      )
    }

    if (normalize(empresa) === "empresa por identificar") {
      return NextResponse.json(
        {
          error:
            "Esta oferta todavía no tiene una empresa identificada. Revísala antes de contactar.",
        },
        { status: 409 },
      )
    }

    if (!opportunityKey) {
      const oportunidad = await resolveOpportunity(empresa, puesto, municipio)
      opportunityKey = clean(oportunidad?.opportunityKey)
      if (!provincia) provincia = clean(oportunidad?.provincia)
    }

    if (!opportunityKey) {
      return NextResponse.json(
        {
          error:
            "No se pudo vincular esta empresa con una oportunidad concreta. No se ha enviado ningún email.",
        },
        { status: 409 },
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
          "x-naem-secret": CONTACT_SECRET,
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
          client_alias: email,
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
