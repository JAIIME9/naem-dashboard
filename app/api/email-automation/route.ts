import { NextResponse } from "next/server"

const WEBHOOK_URL =
  process.env.N8N_EMAIL_SETTINGS_WEBHOOK_URL ||
  "https://naemadmin.app.n8n.cloud/webhook/naem-email-settings-4055dae97949bb9b"

const AUTOMATION_SECRET =
  process.env.NAEM_AUTOMATION_SECRET ||
  "4055dae97949bb9b2a32c0f987007cdc"

async function callN8n(payload: Record<string, unknown>) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-NAEM-Secret": AUTOMATION_SECRET,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`n8n respondió ${response.status}`)
  }

  return response.json()
}

export async function GET() {
  try {
    const data = await callN8n({ action: "get" })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      {
        autoEmail: false,
        soloNuevas: true,
        soloEmailVerificado: true,
        connected: false,
      },
      { status: 503 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await callN8n({
      action: "set",
      autoEmail: Boolean(body.autoEmail),
      soloNuevas: body.soloNuevas !== false,
      soloEmailVerificado: body.soloEmailVerificado !== false,
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la automatización" },
      { status: 503 },
    )
  }
}
