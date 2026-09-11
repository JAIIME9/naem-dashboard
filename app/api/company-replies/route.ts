import { NextResponse } from "next/server"
import tls from "node:tls"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const IMAP_HOST = "imap.gmail.com"
const IMAP_PORT = 993
const IMAP_USER = process.env.NAEM_SMTP_USER || "naemadminapp@gmail.com"
const IMAP_PASSWORD = (
  process.env.NAEM_GMAIL_APP_PASSWORD ||
  process.env.NAEM_SMTP_PASSWORD ||
  ""
).replace(/\s+/g, "")

const CONTACT_MAP_WEBHOOK =
  process.env.NAEM_N8N_CONTACT_MAP_WEBHOOK ||
  "https://naemadmin.app.n8n.cloud/webhook/naem-contact-map-2d8c7a4f1e69b305"

const CONTACT_SECRET =
  process.env.NAEM_N8N_CONTACT_SECRET ||
  "naem-contact-7e6f2b8c9a1d4f35b0c7e2a9"

const BLOCKED_FALLBACKS = new Set([
  "deltadesigncontact@gmail.com",
  "naemadminapp@gmail.com",
])

interface CompanyInput {
  id: string
  email: string
}

interface ReplyData {
  from: string
  subject: string
  date: string
  body: string
  uid: string
}

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
}

function escapeImap(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

async function resolveContactEmails(aliases: string[]) {
  if (aliases.length === 0) return {} as Record<string, string>

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12_000)

    let response: Response
    try {
      response = await fetch(CONTACT_MAP_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-naem-secret": CONTACT_SECRET,
        },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({ aliases }),
      })
    } finally {
      clearTimeout(timeout)
    }

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result?.ok !== true || typeof result?.map !== "object") {
      return {}
    }

    return result.map as Record<string, string>
  } catch {
    return {}
  }
}

function waitForGreeting(socket: tls.TLSSocket) {
  return new Promise<string>((resolve, reject) => {
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
      reject(new Error("Tiempo de espera IMAP agotado"))
    }

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8")
      if (buffer.includes("\r\n")) {
        cleanup()
        resolve(buffer)
      }
    }

    socket.on("data", onData)
    socket.once("error", onError)
    socket.once("timeout", onTimeout)
  })
}

function readUntilTag(socket: tls.TLSSocket, tag: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []

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
      reject(new Error("Tiempo de espera IMAP agotado"))
    }

    const onData = (chunk: Buffer) => {
      chunks.push(chunk)
      const buffer = Buffer.concat(chunks)
      const text = buffer.toString("utf8")
      const done = new RegExp(`(?:^|\\r?\\n)${tag} (OK|NO|BAD)\\b`, "m").exec(text)
      if (done) {
        cleanup()
        resolve(buffer)
      }
    }

    socket.on("data", onData)
    socket.once("error", onError)
    socket.once("timeout", onTimeout)
  })
}

async function openImap() {
  if (!IMAP_PASSWORD) {
    throw new Error("Falta NAEM_GMAIL_APP_PASSWORD en Vercel")
  }

  const socket = tls.connect({
    host: IMAP_HOST,
    port: IMAP_PORT,
    servername: IMAP_HOST,
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

  const greeting = await waitForGreeting(socket)
  if (!/^\* OK/im.test(greeting)) {
    socket.destroy()
    throw new Error("Gmail no aceptó la conexión IMAP")
  }

  let counter = 1
  const command = async (value: string) => {
    const tag = `A${String(counter++).padStart(3, "0")}`
    const responsePromise = readUntilTag(socket, tag)
    socket.write(`${tag} ${value}\r\n`)
    const response = await responsePromise
    const text = response.toString("utf8")
    const status = new RegExp(`(?:^|\\r?\\n)${tag} (OK|NO|BAD)\\b`, "m").exec(text)?.[1]
    if (status !== "OK") {
      throw new Error(`IMAP ${status ?? "ERROR"}: ${text.slice(-500)}`)
    }
    return response
  }

  await command(
    `LOGIN "${escapeImap(IMAP_USER)}" "${escapeImap(IMAP_PASSWORD)}"`,
  )
  await command("EXAMINE INBOX")

  return { socket, command }
}

function extractSearchUids(response: Buffer) {
  const text = response.toString("utf8")
  const match = /\* SEARCH(?: ([0-9 ]+))?\r?\n/i.exec(text)
  if (!match?.[1]) return []
  return match[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function extractLiterals(response: Buffer) {
  const latin1 = response.toString("latin1")
  const literals: string[] = []
  const regex = /\{(\d+)\}\r\n/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(latin1))) {
    const size = Number(match[1])
    const start = match.index + match[0].length
    const end = start + size
    if (end > response.length) break
    literals.push(response.subarray(start, end).toString("utf8"))
    regex.lastIndex = end
  }

  return literals
}

function decodeMimeWords(value: string) {
  return value.replace(
    /=\?([^?]+)\?([bq])\?([^?]+)\?=/gi,
    (_, _charset: string, encoding: string, data: string) => {
      try {
        if (encoding.toLowerCase() === "b") {
          return Buffer.from(data, "base64").toString("utf8")
        }
        const decoded = data
          .replace(/_/g, " ")
          .replace(/=([0-9a-f]{2})/gi, (_m: string, hex: string) =>
            String.fromCharCode(parseInt(hex, 16)),
          )
        return Buffer.from(decoded, "binary").toString("utf8")
      } catch {
        return data
      }
    },
  )
}

function unfoldHeaders(headers: string) {
  return headers.replace(/\r?\n[\t ]+/g, " ")
}

function getHeader(headers: string, name: string) {
  const unfolded = unfoldHeaders(headers)
  const match = new RegExp(`^${name}:\\s*(.*)$`, "im").exec(unfolded)
  return match?.[1]?.trim() ?? ""
}

function decodeQuotedPrintable(value: string) {
  const cleaned = value.replace(/=\r?\n/g, "")
  const binary = cleaned.replace(/=([0-9A-F]{2})/gi, (_m, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  )
  return Buffer.from(binary, "binary").toString("utf8")
}

function decodeTransfer(value: string, encoding: string) {
  const mode = encoding.toLowerCase()
  if (mode.includes("base64")) {
    try {
      return Buffer.from(value.replace(/\s+/g, ""), "base64").toString("utf8")
    } catch {
      return value
    }
  }
  if (mode.includes("quoted-printable")) return decodeQuotedPrintable(value)
  return value
}

function htmlToText(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function extractReadableBody(headers: string, body: string, depth = 0): string {
  if (depth > 3) return body

  const contentType = getHeader(headers, "Content-Type") || "text/plain"
  const transfer = getHeader(headers, "Content-Transfer-Encoding")
  const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType)?.[1] ||
    /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType)?.[2]

  if (/multipart\//i.test(contentType) && boundary) {
    const parts = body.split(`--${boundary}`)
    let htmlFallback = ""

    for (const part of parts) {
      const normalized = part.replace(/^\r?\n/, "")
      const splitAt = normalized.search(/\r?\n\r?\n/)
      if (splitAt < 0) continue
      const partHeaders = normalized.slice(0, splitAt)
      const partBody = normalized.slice(splitAt).replace(/^\r?\n\r?\n/, "")
      const partType = getHeader(partHeaders, "Content-Type") || "text/plain"

      if (/text\/plain/i.test(partType)) {
        return extractReadableBody(partHeaders, partBody, depth + 1)
      }
      if (/multipart\//i.test(partType)) {
        const nested = extractReadableBody(partHeaders, partBody, depth + 1)
        if (nested.trim()) return nested
      }
      if (/text\/html/i.test(partType) && !htmlFallback) {
        htmlFallback = htmlToText(
          decodeTransfer(partBody, getHeader(partHeaders, "Content-Transfer-Encoding")),
        )
      }
    }

    return htmlFallback
  }

  const decoded = decodeTransfer(body, transfer)
  return /text\/html/i.test(contentType) ? htmlToText(decoded) : decoded
}

function cleanReplyBody(value: string) {
  let text = value
    .replace(/\r/g, "")
    .replace(/^>.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const separators = [
    /\nEl .+ escribió:\s*$/im,
    /\nOn .+ wrote:\s*$/im,
    /\nDe:\s.+$/im,
    /\nFrom:\s.+$/im,
    /\n-{2,}\s*Mensaje original\s*-{2,}/im,
    /\n-{2,}\s*Original Message\s*-{2,}/im,
  ]

  for (const separator of separators) {
    const match = separator.exec(text)
    if (match && match.index > 0) text = text.slice(0, match.index).trim()
  }

  return text.slice(0, 3000) || "Respuesta recibida sin texto legible."
}

function parseFetchedMessage(response: Buffer, uid: string): ReplyData | null {
  const raw = extractLiterals(response)[0]
  if (!raw) return null

  const splitAt = raw.search(/\r?\n\r?\n/)
  if (splitAt < 0) return null

  const headers = raw.slice(0, splitAt)
  const body = raw.slice(splitAt).replace(/^\r?\n\r?\n/, "")
  const from = decodeMimeWords(getHeader(headers, "From"))
  const subject = decodeMimeWords(getHeader(headers, "Subject")) || "Respuesta del cliente"
  const dateHeader = getHeader(headers, "Date")
  const parsedDate = new Date(dateHeader)
  const date = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString()
  const readable = extractReadableBody(headers, body)

  return {
    from,
    subject,
    date,
    body: cleanReplyBody(readable),
    uid,
  }
}

async function findLatestReply(
  command: (value: string) => Promise<Buffer>,
  email: string,
): Promise<ReplyData | null> {
  const search = await command(
    `UID SEARCH FROM "${escapeImap(email)}" SUBJECT "NAEM ETT"`,
  )
  const uids = extractSearchUids(search)
  const uid = uids.at(-1)
  if (!uid) return null

  const fetch = await command(`UID FETCH ${uid} (BODY.PEEK[]<0.16000>)`)
  return parseFetchedMessage(fetch, uid)
}

export async function POST(request: Request) {
  let socket: tls.TLSSocket | null = null

  try {
    const payload = await request.json().catch(() => ({}))
    const companies = Array.isArray(payload?.companies)
      ? (payload.companies as CompanyInput[])
      : []

    const normalized = companies
      .map((company) => ({
        id: clean(company?.id),
        alias: clean(company?.email).toLowerCase(),
      }))
      .filter((company) => company.id && company.alias)

    const aliases = [...new Set(normalized.map((company) => company.alias))]
    const resolved = await resolveContactEmails(aliases)

    const allowed = normalized
      .map((company) => {
        const mapped = clean(resolved[company.alias]).toLowerCase()
        const fallback =
          !company.alias.endsWith("@example.invalid") &&
          !BLOCKED_FALLBACKS.has(company.alias) &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.alias)
            ? company.alias
            : ""

        return {
          id: company.id,
          email: mapped || fallback,
        }
      })
      .filter((company) => company.email)
      .slice(0, 20)

    if (allowed.length === 0) {
      return NextResponse.json({ ok: true, replies: {}, checked: 0 })
    }

    const connection = await openImap()
    socket = connection.socket
    const replies: Record<string, ReplyData> = {}

    for (const company of allowed) {
      const reply = await findLatestReply(connection.command, company.email)
      if (reply) replies[company.id] = reply
    }

    try {
      await connection.command("LOGOUT")
    } catch {
      // Gmail puede cerrar el socket inmediatamente tras LOGOUT.
    }
    socket.end()
    socket = null

    return NextResponse.json({
      ok: true,
      replies,
      checked: allowed.length,
      demoMode: false,
    })
  } catch (error) {
    socket?.destroy()
    console.error("Error comprobando respuestas de Gmail:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron comprobar las respuestas",
      },
      { status: 500 },
    )
  }
}
