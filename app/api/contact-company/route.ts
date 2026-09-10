import { NextResponse } from "next/server"
import tls from "node:tls"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SMTP_HOST = "smtp.gmail.com"
const SMTP_PORT = 465
const SMTP_USER = process.env.NAEM_SMTP_USER || "naemadminapp@gmail.com"
const SMTP_PASSWORD = (
  process.env.NAEM_GMAIL_APP_PASSWORD ||
  process.env.NAEM_SMTP_PASSWORD ||
  ""
).replace(/\s+/g, "")
const DEMO_RECIPIENT = (
  process.env.NAEM_DEMO_RECIPIENT || "deltadesigncontact@gmail.com"
).toLowerCase()

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
}

function readResponse(socket: tls.TLSSocket) {
  return new Promise<{ code: number; text: string }>((resolve, reject) => {
    let buffer = ""

    const cleanup = () => {
      socket.off("data", onData)
      socket.off("error", onError)
      socket.off("timeout", onTimeout)
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const onTimeout = () => {
      cleanup()
      reject(new Error("Tiempo de espera SMTP agotado"))
    }

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8")
      const lines = buffer.split(/\r?\n/)

      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i]
        if (/^\d{3} /.test(line)) {
          cleanup()
          resolve({ code: Number(line.slice(0, 3)), text: buffer.trim() })
          return
        }
      }
    }

    socket.on("data", onData)
    socket.once("error", onError)
    socket.once("timeout", onTimeout)
  })
}

async function command(
  socket: tls.TLSSocket,
  value: string,
  expected: number[],
) {
  const responsePromise = readResponse(socket)
  socket.write(`${value}\r\n`)
  const response = await responsePromise

  if (!expected.includes(response.code)) {
    throw new Error(`SMTP ${response.code}: ${response.text}`)
  }

  return response
}

async function sendSmtpEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  if (!SMTP_PASSWORD) {
    throw new Error(
      "Falta configurar NAEM_GMAIL_APP_PASSWORD en las variables de entorno de Vercel",
    )
  }

  const socket = tls.connect({
    host: SMTP_HOST,
    port: SMTP_PORT,
    servername: SMTP_HOST,
    rejectUnauthorized: true,
  })

  socket.setTimeout(15_000)

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      socket.off("secureConnect", onConnect)
      reject(error)
    }
    const onConnect = () => {
      socket.off("error", onError)
      resolve()
    }
    socket.once("error", onError)
    socket.once("secureConnect", onConnect)
  })

  const greeting = await readResponse(socket)
  if (greeting.code !== 220) {
    socket.destroy()
    throw new Error(`SMTP ${greeting.code}: ${greeting.text}`)
  }

  await command(socket, "EHLO naem-empleo.vercel.app", [250])
  await command(socket, "AUTH LOGIN", [334])
  await command(socket, Buffer.from(SMTP_USER).toString("base64"), [334])
  await command(socket, Buffer.from(SMTP_PASSWORD).toString("base64"), [235])
  await command(socket, `MAIL FROM:<${SMTP_USER}>`, [250])
  await command(socket, `RCPT TO:<${to}>`, [250, 251])
  await command(socket, "DATA", [354])

  const message = [
    `From: ${encodeHeader("NAEM ETT")} <${SMTP_USER}>`,
    `Reply-To: ${SMTP_USER}`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ]
    .join("\r\n")
    .replace(/^\./gm, "..")

  const dataResponse = readResponse(socket)
  socket.write(`${message}\r\n.\r\n`)
  const finalResponse = await dataResponse

  if (finalResponse.code !== 250) {
    socket.destroy()
    throw new Error(`SMTP ${finalResponse.code}: ${finalResponse.text}`)
  }

  try {
    await command(socket, "QUIT", [221])
  } finally {
    socket.end()
  }
}

function isSafeDemoAddress(email: string) {
  return email === DEMO_RECIPIENT || email.endsWith("@example.invalid")
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const empresa = clean(payload.empresa)
    const puesto = clean(payload.puesto) || "personal"
    const municipio = clean(payload.municipio)

    if (!empresa) {
      return NextResponse.json(
        { error: "Falta el nombre de la empresa" },
        { status: 400 },
      )
    }

    const demoMode = process.env.NAEM_DEMO_MODE !== "false"
    const requestedEmail = clean(payload.email).toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
      return NextResponse.json(
        { error: "La empresa no tiene un email válido" },
        { status: 400 },
      )
    }

    if (demoMode && !isSafeDemoAddress(requestedEmail)) {
      return NextResponse.json(
        { error: "Destinatario bloqueado en modo demo" },
        { status: 400 },
      )
    }

    const ubicacion = municipio ? ` en ${municipio}` : ""
    const subject = `Personal para ${puesto} | NAEM ETT`
    const body = `Buenos días,\n\nMe pongo en contacto con vosotros desde NAEM ETT porque hemos visto que ${empresa} está buscando incorporar personal para el puesto de ${puesto}${ubicacion}.\n\nDesde NAEM podemos ayudaros a cubrir esta necesidad de personal de forma ágil, encargándonos del proceso de selección y facilitándoos candidatos adecuados al perfil que necesitáis.\n\nSi el proceso de selección sigue abierto, estaremos encantados de hablar con vosotros y conocer mejor las necesidades concretas del puesto.\n\nQuedamos a vuestra disposición.\n\nUn saludo,\n\nEquipo NAEM ETT\nEmpresa de Trabajo Temporal`

    if (demoMode && requestedEmail.endsWith("@example.invalid")) {
      return NextResponse.json({
        ok: true,
        sentTo: requestedEmail,
        empresa,
        puesto,
        demoMode,
        simulated: true,
      })
    }

    await sendSmtpEmail({ to: requestedEmail, subject, body })

    return NextResponse.json({
      ok: true,
      sentTo: requestedEmail,
      empresa,
      puesto,
      demoMode,
      simulated: false,
    })
  } catch (error) {
    console.error("Error enviando email de contacto:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el email de contacto",
      },
      { status: 500 },
    )
  }
}
