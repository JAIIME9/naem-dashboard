import { cache } from "react"
import { unstable_cache } from "next/cache"

import { municipioCoords, type PuntoMapa } from "./geo"
import { classifyProfile, limpiarFuente, movilWhatsapp, perfilDesdeDescripcion, tituloPuesto } from "./presentation"
import type {
  DistribucionPerfil,
  Empresa,
  EstadoComercial,
  EstadoOportunidad,
  Kpi,
  Municipio,
  Notificacion,
  OtroPerfil,
  Oportunidad,
  Perfil,
  Periodo,
  PuntoSerie,
  Prioridad,
  TipoPerfil,
  ZonaActividad,
} from "./types"

type RawOpportunity = Record<string, unknown>
type RawProfile = Record<string, unknown>
type DashboardPayload = {
  ok?: boolean
  generatedAt?: string
  oportunidades?: RawOpportunity[]
  perfiles?: RawProfile[]
}

const DASHBOARD_WEBHOOK = process.env.NAEM_N8N_DASHBOARD_WEBHOOK || ""
const WEBHOOK_SECRET = process.env.NAEM_WEBHOOK_SECRET || ""

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function asDate(value: unknown) {
  const d = new Date(clean(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function boolValue(value: unknown) {
  if (value === true || value === 1) return true
  const v = normalize(value)
  return v === "true" || v === "1" || v === "si" || v === "yes" || v === "verificado" || v === "verified"
}

function empresaIdentificada(value: unknown) {
  const v = normalize(value)
  if (!v) return false
  return !(
    v.startsWith("empresa por identificar") ||
    v.startsWith("empresa no identificada") ||
    v.startsWith("empresa desconocida") ||
    v === "por identificar" ||
    v === "sin identificar" ||
    v === "desconocida" ||
    v === "desconocido" ||
    v === "unknown" ||
    v === "n/a" ||
    v === "na"
  )
}

function rawEmpresa(raw: RawOpportunity) {
  return clean(raw.empresa || raw.empresaNombre || raw["Empresa nombre"])
}

function rawEmail(raw: RawOpportunity) {
  return clean(
    raw.emailContacto ||
      raw.email_contacto ||
      raw.email ||
      raw["Email contacto"] ||
      raw["Email"],
  ).toLowerCase()
}

function rawTelefono(raw: RawOpportunity) {
  return clean(
    raw.telefonoContacto ||
      raw.telefono_contacto ||
      raw.telefono ||
      raw["Teléfono contacto"] ||
      raw["Telefono contacto"],
  )
}

function rawWeb(raw: RawOpportunity) {
  return clean(raw.empresaWeb || raw.empresa_web || raw.web || raw["Empresa web"])
}

function rawFuenteContacto(raw: RawOpportunity) {
  return clean(
    raw.fuenteEmail ||
      raw.fuente_email ||
      raw.contactoFuente ||
      raw.contacto_fuente ||
      raw["Fuente email"],
  )
}

function emailValido(value: unknown) {
  const email = clean(value).toLowerCase()
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) return false
  const dominio = email.split("@")[1] || ""
  return ![
    "example.com",
    "example.org",
    "example.net",
    "test.invalid",
    "invalid",
  ].includes(dominio)
}

function emailVerificado(raw: RawOpportunity) {
  const explicit =
    raw.emailVerificado ??
    raw.email_verificado ??
    raw["Email verificado"] ??
    raw.contactoVerificado ??
    raw.contacto_verificado

  // Los registros antiguos no tenían esta columna. Si ya existe un email real
  // guardado, se considera utilizable; los nuevos registros sí pueden marcar
  // explícitamente false y entonces quedan fuera.
  if (explicit === undefined || explicit === null || clean(explicit) === "") {
    return emailValido(rawEmail(raw))
  }
  return boolValue(explicit) && emailValido(rawEmail(raw))
}

function rawContactable(raw: RawOpportunity) {
  return empresaIdentificada(rawEmpresa(raw)) && emailVerificado(raw)
}

function normalizeTipoPerfil(value: unknown): TipoPerfil {
  const s = normalize(value)
  if (s.includes("limpieza")) return "Limpieza"
  if (s.includes("camarer")) return "Camareros"
  if (s.includes("cocin")) return "Cocineros"
  if (s.includes("administr")) return "Administrativos"
  if (s.includes("almacen") || s.includes("mozo") || s.includes("logistic")) return "Almacén"
  if (s.includes("depend") || s.includes("tienda")) return "Dependientes"
  if (s.includes("agric") || s.includes("campo") || s.includes("peon agric")) return "Agricultura"
  if (s.includes("constru") || s.includes("obra")) return "Construcción"
  return "Otros"
}

function normalizeEstado(raw: RawOpportunity): EstadoOportunidad {
  const contacto = normalize(raw.contactoEstado || raw.contacto_estado || raw["Contacto estado"])
  if (contacto === "contactado" || contacto === "contactada" || contacto === "enviado") {
    return "Contactada"
  }

  const estado = clean(raw.estado || raw.Estado)
  const permitidos: EstadoOportunidad[] = [
    "Nueva",
    "Revisada",
    "Contactada",
    "Interesante",
    "Descartada",
  ]
  return permitidos.includes(estado as EstadoOportunidad)
    ? (estado as EstadoOportunidad)
    : "Nueva"
}

function normalizePrioridad(value: unknown): Prioridad {
  const s = clean(value)
  return s === "Alta" || s === "Baja" ? s : "Media"
}

const fetchDashboardCached = unstable_cache(
  async (): Promise<DashboardPayload | null> => {
    if (!DASHBOARD_WEBHOOK || !WEBHOOK_SECRET) throw new Error("Falta la configuración del webhook")

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
          body: JSON.stringify({}),
          cache: "no-store",
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`)
      const data = (await response.json().catch(() => null)) as DashboardPayload | null
      if (!data || data.ok !== true || !Array.isArray(data.oportunidades)) throw new Error("Respuesta incompleta del webhook")

      return {
        ...data,
        // La app solo trabaja con empresas identificadas y con email utilizable.
        oportunidades: data.oportunidades.filter(rawContactable),
        perfiles: Array.isArray(data.perfiles) ? data.perfiles : [],
      }
    } catch (error) {
      throw error
    }
  },
  ["naem-dashboard-contactable-v1"],
  { revalidate: 8 },
)

// Deduplica todas las llamadas de una misma navegación. Antes cada widget del
// resumen disparaba su propio webhook de n8n, provocando varias ejecuciones por clic.
const loadDashboard = cache(async (): Promise<DashboardPayload | null> => {
  try {
    return await fetchDashboardCached()
  } catch {
    return null
  }
})

function toOportunidad(raw: RawOpportunity, index: number): Oportunidad {
  const perfilDetectado = clean(raw.perfilDetectado || raw["Perfil detectado"] || raw.perfil)
  const tipoRaw = clean(raw.tipoPerfil || raw["Tipo de perfil"] || perfilDetectado)
  // El título del puesto sale de "Empresa — Puesto"; perfil_detectado en filas antiguas era solo una palabra clave.
  const titulo =
    tituloPuesto(raw.oportunidad || raw.Oportunidad) || clean(raw.titulo) || "Oportunidad detectada"
  const empresa = rawEmpresa(raw)
  const descripcion = clean(raw.descripcion || raw.Descripción)
  let tipoPerfil = classifyProfile(titulo, tipoRaw, perfilDetectado)
  if (tipoPerfil === "Otros") tipoPerfil = perfilDesdeDescripcion(descripcion) || "Otros"

  return {
    id: clean(raw.id) || clean(raw.opportunityKey || raw.opportunity_key || raw["Opportunity Key"]) || `opp_${index + 1}`,
    opportunityKey: clean(raw.opportunityKey || raw.opportunity_key || raw["Opportunity Key"]),
    titulo,
    empresa,
    perfil: clean(raw.perfil) || perfilDetectado || tipoRaw || "Otros",
    tipoPerfil,
    municipio: clean(raw.municipio || raw.Municipio),
    provincia: clean(raw.provincia || raw.Provincia),
    zona: clean(raw.zona || raw.Zona),
    urlOferta: clean(raw.url || raw.URL),
    fuente: limpiarFuente(raw.fuente || raw.Fuente),
    fechaPublicacion: clean(raw.fechaPublicacion || raw["Fecha publicación"]),
    fechaDeteccion: clean(raw.fechaDeteccion || raw["Fecha detección"]),
    estado: normalizeEstado(raw),
    prioridad: normalizePrioridad(raw.prioridad || raw.Prioridad),
    descripcion,
    notas: clean(raw.notas || raw.Notas),
  }
}

async function liveOportunidades(): Promise<Oportunidad[]> {
  const data = await loadDashboard()
  if (!data) return []
  return (data.oportunidades || []).map(toOportunidad)
}

function filterPeriodo(items: Oportunidad[], periodo: Periodo) {
  const now = Date.now()
  const maxMs = periodo === "hoy" ? 86_400_000 : periodo === "7d" ? 7 * 86_400_000 : 30 * 86_400_000
  return items.filter((o) => {
    const d = asDate(o.fechaDeteccion)
    return d ? now - d.getTime() <= maxMs : periodo === "30d"
  })
}

export async function getOportunidades(): Promise<Oportunidad[]> {
  return liveOportunidades()
}

export async function getOportunidadesRecientes(
  limite = 6,
  periodo: Periodo = "30d",
): Promise<Oportunidad[]> {
  const live = await liveOportunidades()
  return filterPeriodo(live, periodo)
    .sort((a, b) => (asDate(b.fechaDeteccion)?.getTime() ?? 0) - (asDate(a.fechaDeteccion)?.getTime() ?? 0))
    .slice(0, Math.max(1, limite))
}

export async function getEmpresas(): Promise<Empresa[]> {
  const data = await loadDashboard()
  if (!data) return []

  const map = new Map<
    string,
    {
      nombre: string
      web: string
      email: string
      emailVerificado: boolean
      telefono: string
      contactoFuente: string
      opportunityKey: string
      municipio: string
      provincia: string
      tipoPerfil: TipoPerfil
      perfilBuscado: string
      oportunidades: number
      contactada: boolean
      primera: string
      ultima: string
      descripcion: string
    }
  >()

  for (const raw of data.oportunidades || []) {
    if (!rawContactable(raw)) continue
    const nombre = rawEmpresa(raw)
    const key = normalize(nombre)
    if (!key) continue

    const fecha = clean(raw.fechaDeteccion || raw["Fecha detección"])
    const actual = map.get(key)
    const opp = toOportunidad(raw, 0)
    const perfil = opp.titulo
    const tipo = opp.tipoPerfil
    const contacto = normalize(raw.contactoEstado || raw.contacto_estado || raw["Contacto estado"])
    const oppKey = clean(raw.opportunityKey || raw.opportunity_key || raw["Opportunity Key"])

    if (!actual) {
      map.set(key, {
        nombre,
        web: rawWeb(raw),
        email: rawEmail(raw),
        emailVerificado: emailVerificado(raw),
        telefono: movilWhatsapp(rawTelefono(raw)),
        contactoFuente: rawFuenteContacto(raw),
        opportunityKey: oppKey,
        municipio: clean(raw.municipio || raw.Municipio),
        provincia: clean(raw.provincia || raw.Provincia),
        tipoPerfil: tipo,
        perfilBuscado: perfil || tipo,
        oportunidades: 1,
        contactada: contacto === "contactado" || contacto === "contactada" || contacto === "enviado",
        primera: fecha,
        ultima: fecha,
        descripcion: clean(raw.descripcion || raw.Descripción),
      })
      continue
    }

    actual.oportunidades += 1
    actual.contactada ||= contacto === "contactado" || contacto === "contactada" || contacto === "enviado"
    if (!actual.email && rawEmail(raw)) actual.email = rawEmail(raw)
    if (!actual.web && rawWeb(raw)) actual.web = rawWeb(raw)
    if (!actual.telefono && movilWhatsapp(rawTelefono(raw))) actual.telefono = movilWhatsapp(rawTelefono(raw))
    if (!actual.contactoFuente && rawFuenteContacto(raw)) actual.contactoFuente = rawFuenteContacto(raw)
    if (!actual.opportunityKey && oppKey) actual.opportunityKey = oppKey
    actual.emailVerificado ||= emailVerificado(raw)
    if (fecha && (!actual.primera || fecha < actual.primera)) actual.primera = fecha
    if (fecha && (!actual.ultima || fecha > actual.ultima)) actual.ultima = fecha
  }

  return [...map.values()]
    .filter((e) => e.emailVerificado && emailValido(e.email))
    .map((e, index): Empresa => ({
      id: `emp_${index + 1}_${normalize(e.nombre).replace(/[^a-z0-9]+/g, "_").slice(0, 32)}`,
      nombre: e.nombre,
      web: e.web,
      telefono: e.telefono,
      email: e.email,
      emailVerificado: e.emailVerificado,
      contactoFuente: e.contactoFuente,
      opportunityKey: e.opportunityKey,
      municipio: e.municipio,
      provincia: e.provincia,
      sector: e.tipoPerfil,
      oportunidades: e.oportunidades,
      estadoComercial: (e.contactada ? "En seguimiento" : "Sin contactar") as EstadoComercial,
      primeraDeteccion: e.primera,
      ultimaActividad: e.ultima,
      notas: e.descripcion,
      perfilBuscado: e.perfilBuscado,
      tipoPerfil: e.tipoPerfil,
    }))
    .sort((a, b) => (asDate(b.ultimaActividad)?.getTime() ?? 0) - (asDate(a.ultimaActividad)?.getTime() ?? 0))
}

export async function getPerfiles(): Promise<Perfil[]> {
  const data = await loadDashboard()
  if (!data) return []

  const seen = new Set<TipoPerfil>()
  const out: Perfil[] = []

  for (const raw of data.perfiles || []) {
    const nombre = normalizeTipoPerfil(raw.nombre || raw.Perfil || raw.perfil)
    if (nombre === "Otros" || seen.has(nombre)) continue
    seen.add(nombre)
    out.push({
      id: clean(raw.id) || `perfil_${indexSafe(nombre)}`,
      nombre,
      activo: raw.activo !== false && raw.Activo !== false,
    })
  }

  if (out.length === 0) {
    for (const o of await liveOportunidades()) {
      if (o.tipoPerfil === "Otros" || seen.has(o.tipoPerfil)) continue
      seen.add(o.tipoPerfil)
      out.push({ id: `perfil_${indexSafe(o.tipoPerfil)}`, nombre: o.tipoPerfil, activo: true })
    }
  }

  return out
}

function indexSafe(value: unknown) {
  return normalize(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "item"
}

export async function getOtrosPerfiles(): Promise<OtroPerfil[]> {
  const live = await liveOportunidades()
  const map = new Map<string, { oportunidades: number; empresas: Set<string>; ultima: string }>()

  for (const o of live.filter((x) => x.tipoPerfil === "Otros")) {
    const nombre = o.perfil || o.titulo || "Otro perfil"
    const actual = map.get(nombre) ?? { oportunidades: 0, empresas: new Set<string>(), ultima: "" }
    actual.oportunidades += 1
    actual.empresas.add(o.empresa)
    if (!actual.ultima || o.fechaDeteccion > actual.ultima) actual.ultima = o.fechaDeteccion
    map.set(nombre, actual)
  }

  return [...map.entries()].map(([nombre, v], index) => ({
    id: `otro_${index + 1}`,
    nombre,
    oportunidades: v.oportunidades,
    empresas: v.empresas.size,
    ultimaDeteccion: v.ultima,
  }))
}

export async function getMunicipios(): Promise<Municipio[]> {
  const live = await liveOportunidades()
  const seen = new Map<string, Municipio>()

  for (const o of live) {
    if (!o.municipio) continue
    const key = `${normalize(o.provincia)}|${normalize(o.municipio)}`
    if (!seen.has(key)) {
      seen.set(key, {
        id: `mun_${seen.size + 1}`,
        municipio: o.municipio,
        provincia: o.provincia,
        zona: o.zona,
        activo: true,
      })
    }
  }

  return [...seen.values()].sort((a, b) => a.municipio.localeCompare(b.municipio, "es"))
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const live = await liveOportunidades()
  return [...live]
    .sort((a, b) => (asDate(b.fechaDeteccion)?.getTime() ?? 0) - (asDate(a.fechaDeteccion)?.getTime() ?? 0))
    .slice(0, 8)
    .map((o, index) => ({
      id: `notif_${o.id || index + 1}`,
      texto: `${o.empresa}: ${o.titulo}`,
      tiempo: o.fechaDeteccion,
      leida: false,
      tipo: "oportunidad" as const,
    }))
}

export async function getSerieOportunidades(periodo: Periodo = "30d"): Promise<PuntoSerie[]> {
  const filtered = filterPeriodo(await liveOportunidades(), periodo)
  const days = periodo === "hoy" ? 1 : periodo === "7d" ? 7 : 30
  const map = new Map<string, number>()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    map.set(d.toISOString().slice(0, 10), 0)
  }

  for (const o of filtered) {
    const d = asDate(o.fechaDeteccion)
    if (!d) continue
    const key = d.toISOString().slice(0, 10)
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1)
  }

  return [...map.entries()].map(([fecha, valor]) => ({ fecha, valor }))
}

export async function getDistribucionPerfiles(periodo: Periodo = "30d"): Promise<DistribucionPerfil[]> {
  const map = new Map<TipoPerfil, number>()
  for (const o of filterPeriodo(await liveOportunidades(), periodo)) {
    map.set(o.tipoPerfil, (map.get(o.tipoPerfil) || 0) + 1)
  }
  return [...map.entries()]
    .map(([tipoPerfil, valor]) => ({ tipoPerfil, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getZonasActividad(periodo: Periodo = "30d"): Promise<ZonaActividad[]> {
  const map = new Map<string, number>()
  for (const o of filterPeriodo(await liveOportunidades(), periodo)) {
    const zona = o.zona || o.provincia || "Sin zona"
    map.set(zona, (map.get(zona) || 0) + 1)
  }
  return [...map.entries()]
    .map(([zona, valor]) => ({ zona, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getActividadGeografica(periodo: Periodo = "30d"): Promise<PuntoMapa[]> {
  const porMunicipio = new Map<string, { provincia: string; oportunidades: number; empresas: Set<string> }>()

  for (const o of filterPeriodo(await liveOportunidades(), periodo)) {
    if (!o.municipio || !municipioCoords[o.municipio]) continue
    const actual = porMunicipio.get(o.municipio) ?? {
      provincia: o.provincia,
      oportunidades: 0,
      empresas: new Set<string>(),
    }
    actual.oportunidades += 1
    actual.empresas.add(o.empresa)
    porMunicipio.set(o.municipio, actual)
  }

  return [...porMunicipio.entries()]
    .map(([municipio, v]) => ({
      municipio,
      provincia: v.provincia,
      lat: municipioCoords[municipio].lat,
      lng: municipioCoords[municipio].lng,
      oportunidades: v.oportunidades,
      empresas: v.empresas.size,
    }))
    .sort((a, b) => b.oportunidades - a.oportunidades)
}

export async function getKpis(periodo: Periodo = "30d"): Promise<Kpi[]> {
  const items = filterPeriodo(await liveOportunidades(), periodo)
  const empresas = new Set(items.map((o) => normalize(o.empresa)).filter(Boolean))
  const contactadas = items.filter((o) => o.estado === "Contactada").length
  const porContactar = items.filter((o) => o.estado !== "Contactada" && o.estado !== "Descartada").length

  return [
    { id: "nuevas", etiqueta: "Nuevas oportunidades", valor: items.length, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
    { id: "empresas", etiqueta: "Empresas detectadas", valor: empresas.size, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
    { id: "por-contactar", etiqueta: "Por contactar", valor: porContactar, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
    { id: "contactadas", etiqueta: "Contactadas", valor: contactadas, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
  ]
}

export function etiquetaPeriodoTexto(periodo: Periodo): string {
  if (periodo === "hoy") return "Hoy"
  if (periodo === "7d") return "Últimos 7 días"
  return "Últimos 30 días"
}
