import { municipioCoords, type PuntoMapa } from "./geo"
import {
  etiquetaPeriodoTexto as etiquetaPeriodoTextoDemo,
  getActividadGeografica as getActividadGeograficaDemo,
  getDistribucionPerfiles as getDistribucionPerfilesDemo,
  getEmpresas as getEmpresasDemo,
  getKpis as getKpisDemo,
  getMunicipios as getMunicipiosDemo,
  getNotificaciones as getNotificacionesDemo,
  getOportunidades as getOportunidadesDemo,
  getOportunidadesRecientes as getOportunidadesRecientesDemo,
  getOtrosPerfiles as getOtrosPerfilesDemo,
  getPerfiles as getPerfilesDemo,
  getSerieOportunidades as getSerieOportunidadesDemo,
  getZonasActividad as getZonasActividadDemo,
} from "./data"
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
  oportunidades?: RawOpportunity[]
  perfiles?: RawProfile[]
}

const DASHBOARD_WEBHOOK = process.env.NAEM_N8N_DASHBOARD_WEBHOOK || ""
const WEBHOOK_SECRET = process.env.NAEM_WEBHOOK_SECRET || ""

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function asDate(value: unknown) {
  const d = new Date(clean(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeTipoPerfil(value: unknown): TipoPerfil {
  const s = clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (s.includes("limpieza")) return "Limpieza"
  if (s.includes("camarer")) return "Camareros"
  if (s.includes("cocin")) return "Cocineros"
  if (s.includes("administr")) return "Administrativos"
  if (s.includes("almacen") || s.includes("mozo")) return "Almacén"
  if (s.includes("depend")) return "Dependientes"
  if (s.includes("agric")) return "Agricultura"
  if (s.includes("constru")) return "Construcción"
  return "Otros"
}

function normalizeEstado(raw: RawOpportunity): EstadoOportunidad {
  const estado = clean(raw.estado || raw.Estado)
  const permitidos: EstadoOportunidad[] = [
    "Nueva",
    "Revisada",
    "Contactada",
    "Interesante",
    "Descartada",
  ]
  if (permitidos.includes(estado as EstadoOportunidad)) {
    return estado as EstadoOportunidad
  }
  const contacto = clean(raw.contactoEstado || raw["Contacto estado"])
  return /contactad/i.test(contacto) ? "Contactada" : "Nueva"
}

function normalizePrioridad(value: unknown): Prioridad {
  const s = clean(value)
  return s === "Alta" || s === "Baja" ? s : "Media"
}

async function loadDashboard(): Promise<DashboardPayload | null> {
  if (!DASHBOARD_WEBHOOK || !WEBHOOK_SECRET) return null

  try {
    const response = await fetch(DASHBOARD_WEBHOOK, {
      method: "GET",
      headers: {
        "x-naem-secret": WEBHOOK_SECRET,
      },
      cache: "no-store",
    })

    if (!response.ok) return null
    const data = (await response.json().catch(() => null)) as DashboardPayload | null
    if (!data || data.ok !== true || !Array.isArray(data.oportunidades)) return null
    return data
  } catch {
    return null
  }
}

function toOportunidad(raw: RawOpportunity, index: number): Oportunidad {
  const perfilDetectado = clean(raw.perfilDetectado || raw["Perfil detectado"] || raw.perfil)
  const tipoRaw = clean(raw.tipoPerfil || raw["Tipo de perfil"] || perfilDetectado)
  const titulo = clean(raw.titulo || raw.oportunidad || raw.Oportunidad) || "Oportunidad detectada"
  const empresa = clean(raw.empresa || raw.empresaNombre || raw["Empresa nombre"]) || "Empresa por identificar"

  return {
    id: clean(raw.id) || clean(raw.opportunityKey || raw["Opportunity Key"]) || `opp_${index + 1}`,
    titulo,
    empresa,
    perfil: clean(raw.perfil) || perfilDetectado || tipoRaw || "Otros",
    tipoPerfil: normalizeTipoPerfil(tipoRaw),
    municipio: clean(raw.municipio || raw.Municipio),
    provincia: clean(raw.provincia || raw.Provincia),
    zona: clean(raw.zona || raw.Zona),
    urlOferta: clean(raw.url || raw.URL),
    fuente: clean(raw.fuente || raw.Fuente),
    fechaPublicacion: clean(raw.fechaPublicacion || raw["Fecha publicación"]),
    fechaDeteccion: clean(raw.fechaDeteccion || raw["Fecha detección"]),
    estado: normalizeEstado(raw),
    prioridad: normalizePrioridad(raw.prioridad || raw.Prioridad),
    descripcion: clean(raw.descripcion || raw.Descripción),
    notas: clean(raw.notas || raw.Notas),
  }
}

async function liveOportunidades(): Promise<Oportunidad[] | null> {
  const data = await loadDashboard()
  if (!data) return null
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
  return (await liveOportunidades()) ?? getOportunidadesDemo()
}

export async function getOportunidadesRecientes(
  limite = 6,
  periodo: Periodo = "30d",
): Promise<Oportunidad[]> {
  const live = await liveOportunidades()
  if (!live) return getOportunidadesRecientesDemo(limite, periodo)

  return filterPeriodo(live, periodo)
    .sort((a, b) => (asDate(b.fechaDeteccion)?.getTime() ?? 0) - (asDate(a.fechaDeteccion)?.getTime() ?? 0))
    .slice(0, Math.max(1, limite))
}

export async function getEmpresas(): Promise<Empresa[]> {
  const data = await loadDashboard()
  if (!data) return getEmpresasDemo()

  const map = new Map<string, {
    nombre: string
    web: string
    email: string
    municipio: string
    provincia: string
    tipoPerfil: TipoPerfil
    perfilBuscado: string
    oportunidades: number
    contactada: boolean
    primera: string
    ultima: string
    descripcion: string
  }>()

  for (const raw of data.oportunidades || []) {
    const nombre = clean(raw.empresa || raw.empresaNombre || raw["Empresa nombre"])
    if (!nombre) continue

    const fecha = clean(raw.fechaDeteccion || raw["Fecha detección"])
    const actual = map.get(nombre)
    const perfil = clean(raw.perfilDetectado || raw["Perfil detectado"] || raw.perfil)
    const tipo = normalizeTipoPerfil(raw.tipoPerfil || raw["Tipo de perfil"] || perfil)
    const contacto = clean(raw.contactoEstado || raw["Contacto estado"])

    if (!actual) {
      map.set(nombre, {
        nombre,
        web: clean(raw.empresaWeb || raw["Empresa web"]),
        email: clean(raw.emailContacto || raw["Email contacto"]),
        municipio: clean(raw.municipio || raw.Municipio),
        provincia: clean(raw.provincia || raw.Provincia),
        tipoPerfil: tipo,
        perfilBuscado: perfil || tipo,
        oportunidades: 1,
        contactada: /contactad|enviado/i.test(contacto),
        primera: fecha,
        ultima: fecha,
        descripcion: clean(raw.descripcion || raw.Descripción),
      })
      continue
    }

    actual.oportunidades += 1
    actual.contactada ||= /contactad|enviado/i.test(contacto)
    if (!actual.email) actual.email = clean(raw.emailContacto || raw["Email contacto"])
    if (!actual.web) actual.web = clean(raw.empresaWeb || raw["Empresa web"])
    if (fecha && (!actual.primera || fecha < actual.primera)) actual.primera = fecha
    if (fecha && (!actual.ultima || fecha > actual.ultima)) actual.ultima = fecha
  }

  return [...map.values()].map((e, index): Empresa => ({
    id: `emp_${index + 1}`,
    nombre: e.nombre,
    web: e.web,
    telefono: "",
    email: e.email,
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
}

export async function getPerfiles(): Promise<Perfil[]> {
  const data = await loadDashboard()
  if (!data || !Array.isArray(data.perfiles)) return getPerfilesDemo()

  return data.perfiles.map((raw, index) => ({
    id: clean(raw.id) || `perfil_${index + 1}`,
    nombre: normalizeTipoPerfil(raw.nombre || raw.Perfil || raw.perfil),
    activo: raw.activo !== false && raw.Activo !== false,
  }))
}

export async function getOtrosPerfiles(): Promise<OtroPerfil[]> {
  const live = await liveOportunidades()
  if (!live) return getOtrosPerfilesDemo()

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
  if (!live) return getMunicipiosDemo()

  const seen = new Map<string, Municipio>()
  for (const o of live) {
    if (!o.municipio) continue
    const key = `${o.provincia}|${o.municipio}`
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
  return [...seen.values()]
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const live = await liveOportunidades()
  if (!live) return getNotificacionesDemo()

  return [...live]
    .sort((a, b) => (asDate(b.fechaDeteccion)?.getTime() ?? 0) - (asDate(a.fechaDeteccion)?.getTime() ?? 0))
    .slice(0, 8)
    .map((o, index) => ({
      id: `notif_${index + 1}`,
      texto: `${o.empresa}: ${o.titulo}`,
      tiempo: o.fechaDeteccion,
      leida: false,
      tipo: "oportunidad" as const,
    }))
}

export async function getSerieOportunidades(periodo: Periodo = "30d"): Promise<PuntoSerie[]> {
  const live = await liveOportunidades()
  if (!live) return getSerieOportunidadesDemo(periodo)

  const filtered = filterPeriodo(live, periodo)
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
  const live = await liveOportunidades()
  if (!live) return getDistribucionPerfilesDemo(periodo)

  const map = new Map<TipoPerfil, number>()
  for (const o of filterPeriodo(live, periodo)) {
    map.set(o.tipoPerfil, (map.get(o.tipoPerfil) || 0) + 1)
  }
  return [...map.entries()]
    .map(([tipoPerfil, valor]) => ({ tipoPerfil, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getZonasActividad(periodo: Periodo = "30d"): Promise<ZonaActividad[]> {
  const live = await liveOportunidades()
  if (!live) return getZonasActividadDemo(periodo)

  const map = new Map<string, number>()
  for (const o of filterPeriodo(live, periodo)) {
    const zona = o.zona || o.provincia || "Sin zona"
    map.set(zona, (map.get(zona) || 0) + 1)
  }
  return [...map.entries()]
    .map(([zona, valor]) => ({ zona, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getActividadGeografica(periodo: Periodo = "30d"): Promise<PuntoMapa[]> {
  const live = await liveOportunidades()
  if (!live) return getActividadGeograficaDemo(periodo)

  const porMunicipio = new Map<string, { provincia: string; oportunidades: number; empresas: Set<string> }>()
  for (const o of filterPeriodo(live, periodo)) {
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
  const live = await liveOportunidades()
  if (!live) return getKpisDemo(periodo)

  const items = filterPeriodo(live, periodo)
  const empresas = new Set(items.map((o) => o.empresa).filter(Boolean))
  const contactadas = items.filter((o) => o.estado === "Contactada").length
  const porContactar = Math.max(0, items.length - contactadas)

  return [
    { id: "nuevas", etiqueta: "Nuevas oportunidades", valor: items.length, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
    { id: "empresas", etiqueta: "Empresas detectadas", valor: empresas.size, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
    { id: "por-contactar", etiqueta: "Por contactar", valor: porContactar, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
    { id: "contactadas", etiqueta: "Contactadas", valor: contactadas, deltaEtiqueta: etiquetaPeriodoTexto(periodo) },
  ]
}

export function etiquetaPeriodoTexto(periodo: Periodo): string {
  return etiquetaPeriodoTextoDemo(periodo)
}
