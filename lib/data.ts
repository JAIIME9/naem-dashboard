import { municipioCoords, type PuntoMapa } from "./geo"
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
  TipoPerfil,
  ZonaActividad,
} from "./types"

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

type DashboardPayload = {
  ok?: boolean
  generatedAt?: string
  oportunidades?: RawOpportunity[]
  perfiles?: RawProfile[]
}

const DASHBOARD_WEBHOOK = process.env.NAEM_N8N_DASHBOARD_WEBHOOK || ""
const DASHBOARD_SECRET = process.env.NAEM_WEBHOOK_SECRET || ""

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function tipoPerfil(value: unknown): TipoPerfil {
  const v = normalize(value)
  if (v.includes("limpieza")) return "Limpieza"
  if (v.includes("camarer")) return "Camareros"
  if (v.includes("cocin")) return "Cocineros"
  if (v.includes("admin")) return "Administrativos"
  if (v.includes("almacen") || v.includes("logistic")) return "Almacén"
  if (v.includes("depend") || v.includes("tienda")) return "Dependientes"
  if (v.includes("agric") || v.includes("campo") || v.includes("peon agric")) return "Agricultura"
  if (v.includes("constru") || v.includes("obra")) return "Construcción"
  return "Otros"
}

function estadoOportunidad(raw: RawOpportunity): EstadoOportunidad {
  if (normalize(raw.contactoEstado).includes("contact")) return "Contactada"
  const v = normalize(raw.estado)
  if (v === "revisada") return "Revisada"
  if (v === "contactada") return "Contactada"
  if (v === "interesante") return "Interesante"
  if (v === "descartada") return "Descartada"
  return "Nueva"
}

function isoDate(value: unknown) {
  const s = clean(value)
  if (!s) return ""
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toISOString()
}

function oportunidadFecha(raw: RawOpportunity) {
  return isoDate(raw.fechaDeteccion || raw.fechaPublicacion) || new Date(0).toISOString()
}

function prioridad(raw: RawOpportunity): "Alta" | "Media" | "Baja" {
  if (normalize(raw.contactoEstado).includes("contact")) return "Baja"
  const t = new Date(oportunidadFecha(raw)).getTime()
  if (!Number.isFinite(t)) return "Media"
  const horas = (Date.now() - t) / 3_600_000
  return horas <= 48 ? "Alta" : "Media"
}

async function getDashboard(): Promise<DashboardPayload> {
  if (!DASHBOARD_WEBHOOK || !DASHBOARD_SECRET) {
    console.error("NAEM: faltan NAEM_N8N_DASHBOARD_WEBHOOK o NAEM_WEBHOOK_SECRET")
    return { ok: false, oportunidades: [], perfiles: [] }
  }

  try {
    const response = await fetch(DASHBOARD_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-naem-secret": DASHBOARD_SECRET,
      },
      body: JSON.stringify({}),
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`NAEM: dashboard n8n respondió ${response.status}`)
      return { ok: false, oportunidades: [], perfiles: [] }
    }

    const data = (await response.json()) as DashboardPayload
    if (data?.ok !== true) {
      console.error("NAEM: respuesta inesperada del dashboard n8n")
      return { ok: false, oportunidades: [], perfiles: [] }
    }

    return {
      ok: true,
      generatedAt: data.generatedAt,
      oportunidades: Array.isArray(data.oportunidades) ? data.oportunidades : [],
      perfiles: Array.isArray(data.perfiles) ? data.perfiles : [],
    }
  } catch (error) {
    console.error("NAEM: no se pudo consultar n8n", error)
    return { ok: false, oportunidades: [], perfiles: [] }
  }
}

function toOportunidad(raw: RawOpportunity, index: number): Oportunidad {
  const perfilTexto = clean(raw.perfil || raw.perfilDetectado || raw.tipoPerfil || "Otros")
  const tipo = tipoPerfil(perfilTexto)
  const estado = estadoOportunidad(raw)

  return {
    id: clean(raw.id) || clean(raw.opportunityKey) || `opp_${index + 1}`,
    opportunityKey: clean(raw.opportunityKey),
    titulo: clean(raw.titulo || raw.perfilDetectado || raw.oportunidad || "Oportunidad"),
    empresa: clean(raw.empresa) || "Empresa por identificar",
    perfil: perfilTexto || tipo,
    tipoPerfil: tipo,
    municipio: clean(raw.municipio),
    provincia: clean(raw.provincia),
    zona: clean(raw.zona),
    urlOferta: clean(raw.url),
    fuente: clean(raw.fuente),
    fechaPublicacion: isoDate(raw.fechaPublicacion) || oportunidadFecha(raw),
    fechaDeteccion: oportunidadFecha(raw),
    estado,
    prioridad: prioridad(raw),
    descripcion: clean(raw.descripcion),
    notas: "",
  }
}

async function allOportunidades() {
  const data = await getDashboard()
  return (data.oportunidades || []).map(toOportunidad)
}

function cutoff(periodo: Periodo) {
  const now = new Date()
  if (periodo === "hoy") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  }
  const days = periodo === "7d" ? 7 : 30
  return now.getTime() - (days - 1) * 86_400_000
}

function filtrarPeriodo(items: Oportunidad[], periodo: Periodo) {
  const desde = cutoff(periodo)
  return items.filter((o) => {
    const t = new Date(o.fechaDeteccion).getTime()
    return Number.isFinite(t) && t >= desde
  })
}

export async function getOportunidades(): Promise<Oportunidad[]> {
  return allOportunidades()
}

export async function getOportunidadesRecientes(
  limite = 6,
  periodo: Periodo = "30d",
): Promise<Oportunidad[]> {
  const items = filtrarPeriodo(await allOportunidades(), periodo)
  return items
    .sort((a, b) => new Date(b.fechaDeteccion).getTime() - new Date(a.fechaDeteccion).getTime())
    .slice(0, limite)
}

export async function getEmpresas(): Promise<Empresa[]> {
  const data = await getDashboard()
  const raws = data.oportunidades || []
  const porEmpresa = new Map<string, RawOpportunity[]>()

  for (const raw of raws) {
    const nombre = clean(raw.empresa) || "Empresa por identificar"
    const key = normalize(nombre)
    const grupo = porEmpresa.get(key) || []
    grupo.push(raw)
    porEmpresa.set(key, grupo)
  }

  return [...porEmpresa.entries()]
    .map(([key, grupo], index): Empresa => {
      const ordenadas = [...grupo].sort(
        (a, b) => new Date(oportunidadFecha(a)).getTime() - new Date(oportunidadFecha(b)).getTime(),
      )
      const first = ordenadas[0]
      const last = ordenadas.at(-1) || first
      const contactada = grupo.some((x) => normalize(x.contactoEstado).includes("contact"))
      const descartada = grupo.every((x) => normalize(x.estado) === "descartada")
      const estadoComercial: EstadoComercial = descartada
        ? "Descartada"
        : contactada
          ? "En seguimiento"
          : "Sin contactar"
      const perfilTexto = clean(last.perfil || last.perfilDetectado || last.tipoPerfil || "Otros")

      return {
        id: `empresa_${index + 1}_${key.replace(/[^a-z0-9]+/g, "_").slice(0, 36)}`,
        nombre: clean(last.empresa) || "Empresa por identificar",
        web: clean(grupo.find((x) => clean(x.empresaWeb))?.empresaWeb),
        telefono: "",
        email: clean(grupo.find((x) => clean(x.emailContacto))?.emailContacto).toLowerCase(),
        municipio: clean(last.municipio),
        provincia: clean(last.provincia),
        sector: tipoPerfil(perfilTexto),
        oportunidades: grupo.length,
        estadoComercial,
        primeraDeteccion: oportunidadFecha(first),
        ultimaActividad: isoDate(
          grupo.find((x) => clean(x.fechaContacto))?.fechaContacto || last.fechaDeteccion,
        ) || oportunidadFecha(last),
        notas: "",
        perfilBuscado: clean(last.perfilDetectado || last.titulo || last.oportunidad),
        tipoPerfil: tipoPerfil(perfilTexto),
      }
    })
    .sort((a, b) => new Date(b.ultimaActividad).getTime() - new Date(a.ultimaActividad).getTime())
}

export async function getPerfiles(): Promise<Perfil[]> {
  const data = await getDashboard()
  const seen = new Set<TipoPerfil>()
  const out: Perfil[] = []

  for (const raw of data.perfiles || []) {
    const nombre = tipoPerfil(raw.nombre)
    if (nombre === "Otros" || seen.has(nombre)) continue
    seen.add(nombre)
    out.push({
      id: clean(raw.id) || `perfil_${normalize(raw.nombre)}`,
      nombre,
      activo: raw.activo !== false,
    })
  }

  return out
}

export async function getOtrosPerfiles(): Promise<OtroPerfil[]> {
  const items = await allOportunidades()
  const groups = new Map<string, Oportunidad[]>()

  for (const item of items.filter((o) => o.tipoPerfil === "Otros")) {
    const nombre = clean(item.perfil || item.titulo || "Otro perfil")
    const key = normalize(nombre)
    const grupo = groups.get(key) || []
    grupo.push(item)
    groups.set(key, grupo)
  }

  return [...groups.entries()].map(([key, grupo], index) => ({
    id: `otro_${index + 1}_${key.replace(/[^a-z0-9]+/g, "_").slice(0, 30)}`,
    nombre: grupo[0]?.perfil || grupo[0]?.titulo || "Otro perfil",
    oportunidades: grupo.length,
    empresas: new Set(grupo.map((o) => o.empresa)).size,
    ultimaDeteccion: grupo
      .map((o) => o.fechaDeteccion)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0],
  }))
}

export async function getMunicipios(): Promise<Municipio[]> {
  const items = await allOportunidades()
  const map = new Map<string, Municipio>()

  for (const o of items) {
    if (!o.municipio) continue
    const key = `${normalize(o.provincia)}|${normalize(o.municipio)}`
    if (!map.has(key)) {
      map.set(key, {
        id: `mun_${map.size + 1}`,
        municipio: o.municipio,
        provincia: o.provincia,
        zona: o.zona,
        activo: true,
      })
    }
  }

  return [...map.values()].sort((a, b) => a.municipio.localeCompare(b.municipio, "es"))
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const recientes = await getOportunidadesRecientes(5, "30d")
  return recientes.map((o, index) => ({
    id: `notif_${o.id || index + 1}`,
    texto: `${o.empresa}: ${o.titulo}`,
    tiempo: o.fechaDeteccion,
    leida: false,
    tipo: "oportunidad",
  }))
}

export async function getSerieOportunidades(periodo: Periodo = "30d"): Promise<PuntoSerie[]> {
  const items = filtrarPeriodo(await allOportunidades(), periodo)
  const days = periodo === "hoy" ? 1 : periodo === "7d" ? 7 : 30
  const now = new Date()
  const counts = new Map<string, number>()

  for (const o of items) {
    const d = new Date(o.fechaDeteccion)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const out: PuntoSerie[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    out.push({ fecha: new Date(`${key}T12:00:00`).toISOString(), valor: counts.get(key) || 0 })
  }
  return out
}

export async function getDistribucionPerfiles(
  periodo: Periodo = "30d",
): Promise<DistribucionPerfil[]> {
  const items = filtrarPeriodo(await allOportunidades(), periodo)
  const counts = new Map<TipoPerfil, number>()
  for (const o of items) counts.set(o.tipoPerfil, (counts.get(o.tipoPerfil) || 0) + 1)
  return [...counts.entries()]
    .map(([tipoPerfil, valor]) => ({ tipoPerfil, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getZonasActividad(periodo: Periodo = "30d"): Promise<ZonaActividad[]> {
  const items = filtrarPeriodo(await allOportunidades(), periodo)
  const counts = new Map<string, number>()
  for (const o of items) {
    const zona = o.zona || o.provincia || "Sin zona"
    counts.set(zona, (counts.get(zona) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([zona, valor]) => ({ zona, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export async function getActividadGeografica(periodo: Periodo = "30d"): Promise<PuntoMapa[]> {
  const items = filtrarPeriodo(await allOportunidades(), periodo)
  const porMunicipio = new Map<string, { provincia: string; oportunidades: number; empresas: Set<string> }>()

  for (const o of items) {
    if (!o.municipio || !municipioCoords[o.municipio]) continue
    const actual = porMunicipio.get(o.municipio) || {
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
  const items = filtrarPeriodo(await allOportunidades(), periodo)
  const empresas = new Set(items.map((o) => o.empresa).filter(Boolean))
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
