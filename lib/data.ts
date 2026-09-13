import { cache } from "react"
import { municipioCoords, type PuntoMapa } from "./geo"
import type {
  DistribucionPerfil,
  Empresa,
  EstadoOportunidad,
  Kpi,
  Municipio,
  Notificacion,
  OtroPerfil,
  Oportunidad,
  Perfil,
  Periodo,
  Prioridad,
  PuntoSerie,
  TipoPerfil,
  ZonaActividad,
} from "./types"

const DATA_WEBHOOK =
  process.env.NAEM_N8N_DATA_WEBHOOK ||
  "https://naemadmin.app.n8n.cloud/webhook/naem-dashboard-data-v4-7b31c9e2"

const DATA_SECRET =
  process.env.NAEM_N8N_DATA_SECRET ||
  process.env.NAEM_N8N_CONTACT_SECRET ||
  ""

type RawOpportunity = {
  id?: string
  oportunidad?: string
  titulo?: string
  empresa?: string
  empresaWeb?: string
  empresaConfianza?: string
  perfilId?: string
  perfil?: string
  perfilDetectado?: string
  tipoPerfil?: string
  descripcion?: string
  url?: string
  fuente?: string
  fechaPublicacion?: string
  fechaDeteccion?: string
  opportunityKey?: string
  provincia?: string
  municipio?: string
  zona?: string
  estado?: string
  contactoEstado?: string
  emailContacto?: string
  fechaContacto?: string
}

type RawProfile = {
  id?: string
  nombre?: string
  activo?: boolean
}

type LivePayload = {
  ok: boolean
  generatedAt?: string
  oportunidades: RawOpportunity[]
  perfiles: RawProfile[]
}

const EMPTY_PAYLOAD: LivePayload = {
  ok: false,
  oportunidades: [],
  perfiles: [],
}

const loadLiveData = cache(async (): Promise<LivePayload> => {
  if (!DATA_SECRET) {
    console.error(
      "NAEM: falta NAEM_N8N_DATA_SECRET o NAEM_N8N_CONTACT_SECRET en el servidor.",
    )
    return EMPTY_PAYLOAD
  }

  try {
    const response = await fetch(DATA_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-naem-secret": DATA_SECRET,
      },
      body: JSON.stringify({ action: "dashboard" }),
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`NAEM: webhook de datos respondió ${response.status}.`)
      return EMPTY_PAYLOAD
    }

    const data = (await response.json().catch(() => null)) as LivePayload | null

    if (!data || data.ok !== true || !Array.isArray(data.oportunidades)) {
      console.error("NAEM: respuesta inválida del webhook de datos.")
      return EMPTY_PAYLOAD
    }

    return {
      ok: true,
      generatedAt: data.generatedAt,
      oportunidades: data.oportunidades,
      perfiles: Array.isArray(data.perfiles) ? data.perfiles : [],
    }
  } catch (error) {
    console.error("NAEM: no se pudo cargar la información en vivo.", error)
    return EMPTY_PAYLOAD
  }
})

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function norm(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function parseDate(value: unknown): Date | null {
  const text = clean(value)
  if (!text) return null

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

function isoOrFallback(value: unknown, fallback: string): string {
  const date = parseDate(value)
  return date ? date.toISOString() : fallback
}

function tipoPerfil(value: unknown): TipoPerfil {
  const n = norm(value)

  if (n.includes("camar")) return "Camareros"
  if (n.includes("agric") || n.includes("campo")) return "Agricultura"
  if (n.includes("cocin")) return "Cocineros"
  if (n.includes("almacen") || n.includes("mozo")) return "Almacén"
  if (n.includes("limpieza") || n.includes("limpi")) return "Limpieza"
  if (n.includes("constru") || n.includes("alban")) return "Construcción"
  if (n.includes("administr")) return "Administrativos"
  if (n.includes("depend") || n.includes("tienda")) return "Dependientes"

  return "Otros"
}

function estadoOportunidad(raw: RawOpportunity): EstadoOportunidad {
  if (norm(raw.contactoEstado) === "contactada") return "Contactada"

  const n = norm(raw.estado)

  if (n === "nueva") return "Nueva"
  if (n === "revisar" || n === "revisada") return "Revisada"
  if (n === "interesante") return "Interesante"
  if (n === "descartada" || n === "cerrada") return "Descartada"
  if (n === "contactada") return "Contactada"

  return "Revisada"
}

function prioridad(raw: RawOpportunity): Prioridad {
  const estado = estadoOportunidad(raw)
  if (estado === "Contactada" || estado === "Descartada") return "Baja"

  const fecha = parseDate(raw.fechaDeteccion)
  if (!fecha) return estado === "Nueva" ? "Alta" : "Media"

  const horas = (Date.now() - fecha.getTime()) / 3_600_000

  if (estado === "Nueva" && horas <= 72) return "Alta"
  return "Media"
}

function toOpportunity(raw: RawOpportunity, fallbackDate: string): Oportunidad {
  const titulo =
    clean(raw.titulo) ||
    clean(raw.perfilDetectado) ||
    "Oportunidad detectada"

  const empresa = clean(raw.empresa) || "Empresa por identificar"

  const perfilTexto =
    clean(raw.perfil) ||
    clean(raw.perfilDetectado) ||
    "Otros perfiles bajo demanda"

  return {
    id: clean(raw.id) || clean(raw.opportunityKey) || `${empresa}-${titulo}`,
    titulo,
    empresa,
    perfil: perfilTexto,
    tipoPerfil: tipoPerfil(perfilTexto),
    municipio: clean(raw.municipio) || "Sin municipio",
    provincia: clean(raw.provincia),
    zona: clean(raw.zona) || "Cobertura NAEM",
    urlOferta: clean(raw.url),
    fuente: clean(raw.fuente) || "Google Jobs / Bright Data",
    fechaPublicacion: isoOrFallback(raw.fechaPublicacion, fallbackDate),
    fechaDeteccion: isoOrFallback(raw.fechaDeteccion, fallbackDate),
    estado: estadoOportunidad(raw),
    prioridad: prioridad(raw),
    descripcion: clean(raw.descripcion),
    notas:
      empresa === "Empresa por identificar"
        ? "Pendiente de identificar el empleador real."
        : clean(raw.empresaConfianza)
          ? `Confianza empresa: ${clean(raw.empresaConfianza)}`
          : "",
  }
}

function inicioPeriodo(periodo: Periodo, now = new Date()): Date {
  const start = new Date(now)

  if (periodo === "hoy") {
    start.setHours(0, 0, 0, 0)
    return start
  }

  const days = periodo === "7d" ? 7 : 30
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return start
}

function oportunidadesEnPeriodo(
  oportunidades: Oportunidad[],
  periodo: Periodo,
): Oportunidad[] {
  const start = inicioPeriodo(periodo).getTime()

  return oportunidades.filter((item) => {
    const date = parseDate(item.fechaDeteccion)
    return date ? date.getTime() >= start : false
  })
}

export async function getOportunidades(): Promise<Oportunidad[]> {
  const payload = await loadLiveData()
  const fallbackDate = payload.generatedAt || new Date().toISOString()

  return payload.oportunidades
    .map((item) => toOpportunity(item, fallbackDate))
    .sort(
      (a, b) =>
        new Date(b.fechaDeteccion).getTime() -
        new Date(a.fechaDeteccion).getTime(),
    )
}

export async function getOportunidadesRecientes(
  limite = 6,
  periodo: Periodo = "30d",
): Promise<Oportunidad[]> {
  const items = oportunidadesEnPeriodo(await getOportunidades(), periodo)
  return items.slice(0, Math.max(1, limite))
}

export async function getEmpresas(): Promise<Empresa[]> {
  const payload = await loadLiveData()
  const fallbackDate = payload.generatedAt || new Date().toISOString()
  const oportunidades = payload.oportunidades
    .map((raw) => ({ raw, item: toOpportunity(raw, fallbackDate) }))
    .filter(({ item }) => item.empresa !== "Empresa por identificar")

  const groups = new Map<
    string,
    Array<{ raw: RawOpportunity; item: Oportunidad }>
  >()

  for (const entry of oportunidades) {
    const key = norm(entry.item.empresa)
    if (!key) continue

    const list = groups.get(key) ?? []
    list.push(entry)
    groups.set(key, list)
  }

  const empresas: Empresa[] = []

  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        new Date(b.item.fechaDeteccion).getTime() -
        new Date(a.item.fechaDeteccion).getTime(),
    )

    const latest = list[0]
    const companyName = latest.item.empresa

    const firstDate = list.reduce(
      (min, x) =>
        new Date(x.item.fechaDeteccion).getTime() < new Date(min).getTime()
          ? x.item.fechaDeteccion
          : min,
      latest.item.fechaDeteccion,
    )

    const contacted = list.some(
      ({ raw, item }) =>
        norm(raw.contactoEstado) === "contactada" ||
        item.estado === "Contactada",
    )

    const email =
      list.map(({ raw }) => clean(raw.emailContacto)).find(Boolean) || ""

    const web =
      list.map(({ raw }) => clean(raw.empresaWeb)).find(Boolean) || ""

    empresas.push({
      id: `empresa-${norm(companyName).replace(/[^a-z0-9]+/g, "-")}`,
      nombre: companyName,
      web,
      telefono: "",
      email,
      municipio: latest.item.municipio,
      provincia: latest.item.provincia,
      sector: latest.item.tipoPerfil,
      oportunidades: list.length,
      estadoComercial: contacted ? "En seguimiento" : "Sin contactar",
      primeraDeteccion: firstDate,
      ultimaActividad: latest.item.fechaDeteccion,
      notas: "Empresa detectada automáticamente por NAEM.",
      perfilBuscado: latest.item.titulo,
      tipoPerfil: latest.item.tipoPerfil,
    })
  }

  return empresas.sort(
    (a, b) =>
      new Date(b.ultimaActividad).getTime() -
      new Date(a.ultimaActividad).getTime(),
  )
}

export async function getPerfiles(): Promise<Perfil[]> {
  const payload = await loadLiveData()
  const seen = new Set<TipoPerfil>()
  const out: Perfil[] = []

  for (const raw of payload.perfiles) {
    const tipo = tipoPerfil(raw.nombre)
    if (tipo === "Otros" || seen.has(tipo)) continue

    seen.add(tipo)
    out.push({
      id: clean(raw.id) || `perfil-${norm(raw.nombre)}`,
      nombre: tipo,
      activo: raw.activo !== false,
    })
  }

  return out
}

export async function getOtrosPerfiles(): Promise<OtroPerfil[]> {
  const payload = await loadLiveData()
  const fallbackDate = payload.generatedAt || new Date().toISOString()
  const opportunities = payload.oportunidades.map((raw) => ({
    raw,
    item: toOpportunity(raw, fallbackDate),
  }))

  const groups = new Map<
    string,
    { nombre: string; count: number; empresas: Set<string>; latest: string }
  >()

  for (const { raw, item } of opportunities) {
    const isOther =
      item.tipoPerfil === "Otros" ||
      norm(raw.tipoPerfil).includes("otros perfiles")

    if (!isOther) continue

    const nombre = clean(raw.perfilDetectado) || item.titulo
    const key = norm(nombre)
    if (!key) continue

    const current =
      groups.get(key) ??
      {
        nombre,
        count: 0,
        empresas: new Set<string>(),
        latest: item.fechaDeteccion,
      }

    current.count += 1
    current.empresas.add(item.empresa)

    if (
      new Date(item.fechaDeteccion).getTime() >
      new Date(current.latest).getTime()
    ) {
      current.latest = item.fechaDeteccion
    }

    groups.set(key, current)
  }

  return [...groups.entries()]
    .map(([key, value]) => ({
      id: `otro-${key.replace(/[^a-z0-9]+/g, "-")}`,
      nombre: value.nombre,
      oportunidades: value.count,
      empresas: value.empresas.size,
      ultimaDeteccion: value.latest,
    }))
    .sort((a, b) => b.oportunidades - a.oportunidades)
}

export async function getMunicipios(): Promise<Municipio[]> {
  const opportunities = await getOportunidades()
  const seen = new Map<string, Municipio>()

  for (const item of opportunities) {
    const key = `${norm(item.municipio)}|${norm(item.provincia)}`
    if (!item.municipio || seen.has(key)) continue

    seen.set(key, {
      id: `municipio-${key.replace(/[^a-z0-9]+/g, "-")}`,
      municipio: item.municipio,
      provincia: item.provincia,
      zona: item.zona,
      activo: true,
    })
  }

  return [...seen.values()].sort((a, b) =>
    a.municipio.localeCompare(b.municipio, "es"),
  )
}

function relativo(value: string): string {
  const date = parseDate(value)
  if (!date) return ""

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))

  if (minutes < 60) return `hace ${Math.max(1, minutes)} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`

  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const opportunities = (await getOportunidades()).slice(0, 8)

  return opportunities.map((item) => ({
    id: `notif-${item.id}`,
    texto: `${item.empresa} busca ${item.titulo} en ${item.municipio}`,
    tiempo: relativo(item.fechaDeteccion),
    leida: false,
    tipo: "oportunidad",
  }))
}

export async function getSerieOportunidades(
  periodo: Periodo = "30d",
): Promise<PuntoSerie[]> {
  const items = oportunidadesEnPeriodo(await getOportunidades(), periodo)
  const start = inicioPeriodo(periodo)
  const today = new Date()

  const counts = new Map<string, number>()

  for (const item of items) {
    const date = parseDate(item.fechaDeteccion)
    if (!date) continue

    const key = date.toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const out: PuntoSerie[] = []

  for (
    let date = new Date(start);
    date.getTime() <= today.getTime();
    date.setDate(date.getDate() + 1)
  ) {
    const key = date.toISOString().slice(0, 10)
    out.push({
      fecha: key,
      valor: counts.get(key) || 0,
    })
  }

  return out
}

export async function getDistribucionPerfiles(
  periodo: Periodo = "30d",
): Promise<DistribucionPerfil[]> {
  const items = oportunidadesEnPeriodo(await getOportunidades(), periodo)
  const counts = new Map<TipoPerfil, number>()

  for (const item of items) {
    counts.set(item.tipoPerfil, (counts.get(item.tipoPerfil) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([tipoPerfil, valor]) => ({ tipoPerfil, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getZonasActividad(
  periodo: Periodo = "30d",
): Promise<ZonaActividad[]> {
  const items = oportunidadesEnPeriodo(await getOportunidades(), periodo)
  const counts = new Map<string, number>()

  for (const item of items) {
    const zona = item.provincia || item.zona || "Sin provincia"
    counts.set(zona, (counts.get(zona) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([zona, valor]) => ({ zona, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getActividadGeografica(
  periodo: Periodo = "30d",
): Promise<PuntoMapa[]> {
  const items = oportunidadesEnPeriodo(await getOportunidades(), periodo)

  const groups = new Map<
    string,
    { provincia: string; oportunidades: number; empresas: Set<string> }
  >()

  for (const item of items) {
    if (!municipioCoords[item.municipio]) continue

    const current =
      groups.get(item.municipio) ??
      {
        provincia: item.provincia,
        oportunidades: 0,
        empresas: new Set<string>(),
      }

    current.oportunidades += 1
    current.empresas.add(item.empresa)
    groups.set(item.municipio, current)
  }

  return [...groups.entries()]
    .map(([municipio, value]) => ({
      municipio,
      provincia: value.provincia,
      lat: municipioCoords[municipio].lat,
      lng: municipioCoords[municipio].lng,
      oportunidades: value.oportunidades,
      empresas: value.empresas.size,
    }))
    .sort((a, b) => b.oportunidades - a.oportunidades)
}

export async function getKpis(periodo: Periodo = "30d"): Promise<Kpi[]> {
  const items = oportunidadesEnPeriodo(await getOportunidades(), periodo)

  const empresas = new Set(
    items
      .map((x) => x.empresa)
      .filter((x) => x && x !== "Empresa por identificar"),
  )

  const contactadas = items.filter((x) => x.estado === "Contactada").length
  const porContactar = items.filter(
    (x) => x.estado !== "Contactada" && x.estado !== "Descartada",
  ).length

  const etiqueta =
    periodo === "hoy"
      ? "hoy"
      : periodo === "7d"
        ? "en 7 días"
        : "en 30 días"

  return [
    {
      id: "nuevas",
      etiqueta: "Nuevas oportunidades",
      valor: items.length,
      deltaEtiqueta: etiqueta,
    },
    {
      id: "empresas",
      etiqueta: "Empresas detectadas",
      valor: empresas.size,
      deltaEtiqueta: etiqueta,
    },
    {
      id: "por-contactar",
      etiqueta: "Por contactar",
      valor: porContactar,
      deltaEtiqueta: etiqueta,
    },
    {
      id: "contactadas",
      etiqueta: "Contactadas",
      valor: contactadas,
      deltaEtiqueta: etiqueta,
    },
  ]
}

export function etiquetaPeriodoTexto(periodo: Periodo): string {
  if (periodo === "hoy") return "Hoy"
  if (periodo === "7d") return "Últimos 7 días"
  return "Últimos 30 días"
}
