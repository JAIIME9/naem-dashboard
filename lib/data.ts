import { municipioCoords, type PuntoMapa } from "./geo"
import {
  distribucionPerfiles,
  empresas,
  municipios,
  notificaciones,
  oportunidades,
  otrosPerfiles,
  perfiles,
  serieOportunidades30d,
  serieOportunidades7d,
  serieOportunidadesHoy,
  zonasActividad,
} from "./mock-data"
import type {
  DistribucionPerfil,
  Empresa,
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

/**
 * Capa de acceso a datos de NAEM.
 *
 * Hoy devuelve datos mock. Para conectar Airtable, sustituye el cuerpo de cada
 * función por una llamada a la API backend manteniendo estas firmas.
 */

const PERFILES_DEMO: Array<{ tipoPerfil: TipoPerfil; perfilBuscado: string }> = [
  { tipoPerfil: "Camareros", perfilBuscado: "Camarero/a de sala" },
  { tipoPerfil: "Agricultura", perfilBuscado: "Peón agrícola" },
  { tipoPerfil: "Cocineros", perfilBuscado: "Cocinero/a" },
  { tipoPerfil: "Almacén", perfilBuscado: "Mozo/a de almacén" },
  { tipoPerfil: "Construcción", perfilBuscado: "Peón de construcción" },
  { tipoPerfil: "Limpieza", perfilBuscado: "Personal de limpieza" },
  { tipoPerfil: "Administrativos", perfilBuscado: "Administrativo/a" },
  { tipoPerfil: "Dependientes", perfilBuscado: "Dependiente/a" },
  { tipoPerfil: "Otros", perfilBuscado: "Técnico/a de mantenimiento" },
]

const SUFIJOS_DEMO = ["", "Centro", "Levante", "Mediterráneo", "Costa", "Vega"]
const EMAIL_PRUEBA_REAL = "deltadesigncontact@gmail.com"

const emailSeguroDemo = (index: number) => {
  if (index === 0) return EMAIL_PRUEBA_REAL
  const codigo = ((index + 1) * 7919).toString(36)
  return `naem-demo-${String(index + 1).padStart(3, "0")}-${codigo}@example.invalid`
}

const EMPRESAS_DEMO: Empresa[] = Array.from({ length: 84 }, (_, index) => {
  const base = empresas[index % empresas.length]
  const ronda = Math.floor(index / empresas.length)
  const perfil = PERFILES_DEMO[index % PERFILES_DEMO.length]
  const sufijo = SUFIJOS_DEMO[ronda] ?? `Grupo ${ronda + 1}`

  return {
    ...base,
    id: `demo_emp_${String(index + 1).padStart(3, "0")}`,
    nombre: sufijo ? `${base.nombre} ${sufijo}` : base.nombre,
    email: emailSeguroDemo(index),
    oportunidades: (index % 5) + 1,
    estadoComercial:
      index < 47 ? "Sin contactar" : index < 78 ? "En seguimiento" : "Cliente",
    perfilBuscado: perfil.perfilBuscado,
    tipoPerfil: perfil.tipoPerfil,
    notas:
      ronda === 0
        ? base.notas
        : `Empresa ficticia de demostración. Necesidad detectada: ${perfil.perfilBuscado}.`,
  }
})

export async function getOportunidades(): Promise<Oportunidad[]> {
  return oportunidades
}

export async function getOportunidadesRecientes(
  limite = 6,
  periodo: Periodo = "30d",
): Promise<Oportunidad[]> {
  const cantidad = Math.max(
    1,
    Math.min(
      limite,
      Math.round(limite * (periodo === "hoy" ? 0.55 : periodo === "7d" ? 0.8 : 1)),
    ),
  )
  return [...oportunidades]
    .sort(
      (a, b) =>
        new Date(b.fechaDeteccion).getTime() - new Date(a.fechaDeteccion).getTime(),
    )
    .slice(0, cantidad)
}

export async function getEmpresas(): Promise<Empresa[]> {
  return EMPRESAS_DEMO
}

export async function getPerfiles(): Promise<Perfil[]> {
  return perfiles
}

export async function getOtrosPerfiles(): Promise<OtroPerfil[]> {
  return otrosPerfiles
}

export async function getMunicipios(): Promise<Municipio[]> {
  return municipios
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  return notificaciones
}

export async function getSerieOportunidades(periodo: Periodo = "30d"): Promise<PuntoSerie[]> {
  if (periodo === "hoy") return serieOportunidadesHoy
  if (periodo === "7d") return serieOportunidades7d
  return serieOportunidades30d
}

export async function getDistribucionPerfiles(
  periodo: Periodo = "30d",
): Promise<DistribucionPerfil[]> {
  const f = factorPeriodo[periodo]
  return distribucionPerfiles.map((item) => ({
    ...item,
    valor: Math.max(1, Math.round(item.valor * f)),
  }))
}

export async function getZonasActividad(periodo: Periodo = "30d"): Promise<ZonaActividad[]> {
  const f = factorPeriodo[periodo]
  return zonasActividad.map((item) => ({
    ...item,
    valor: Math.max(1, Math.round(item.valor * f)),
  }))
}

export async function getActividadGeografica(periodo: Periodo = "30d"): Promise<PuntoMapa[]> {
  const porMunicipio = new Map<
    string,
    { provincia: string; oportunidades: number; empresas: Set<string> }
  >()

  for (const o of oportunidades) {
    const actual =
      porMunicipio.get(o.municipio) ??
      { provincia: o.provincia, oportunidades: 0, empresas: new Set<string>() }
    actual.oportunidades += 1
    actual.empresas.add(o.empresa)
    porMunicipio.set(o.municipio, actual)
  }

  return [...porMunicipio.entries()]
    .filter(([municipio]) => municipioCoords[municipio])
    .map(([municipio, v]) => ({
      municipio,
      provincia: v.provincia,
      lat: municipioCoords[municipio].lat,
      lng: municipioCoords[municipio].lng,
      oportunidades: Math.max(1, Math.round(v.oportunidades * factorPeriodo[periodo])),
      empresas: Math.max(1, Math.round(v.empresas.size * factorPeriodo[periodo])),
    }))
    .sort((a, b) => b.oportunidades - a.oportunidades)
}

const factorPeriodo: Record<Periodo, number> = {
  hoy: 0.12,
  "7d": 0.4,
  "30d": 1,
}

const etiquetaPeriodo: Record<Periodo, string> = {
  hoy: "hoy",
  "7d": "en 7 días",
  "30d": "en 30 días",
}

export async function getKpis(periodo: Periodo = "30d"): Promise<Kpi[]> {
  const f = factorPeriodo[periodo]
  const escala = (n: number) => Math.max(1, Math.round(n * f))
  const deltaPct = periodo === "hoy" ? 12 : periodo === "7d" ? 16 : 14
  return [
    {
      id: "nuevas",
      etiqueta: "Nuevas oportunidades",
      valor: escala(126),
      delta: deltaPct,
      deltaEtiqueta: `vs. ${periodo === "hoy" ? "ayer" : "periodo anterior"}`,
    },
    {
      id: "empresas",
      etiqueta: "Empresas detectadas",
      valor: escala(84),
      delta: 9,
      deltaEtiqueta: `vs. ${periodo === "hoy" ? "ayer" : "periodo anterior"}`,
    },
    {
      id: "por-contactar",
      etiqueta: "Por contactar",
      valor: escala(47),
      deltaEtiqueta: etiquetaPeriodo[periodo],
    },
    {
      id: "contactadas",
      etiqueta: "Contactadas",
      valor: escala(31),
      delta: 8,
      deltaEtiqueta: `vs. ${periodo === "hoy" ? "ayer" : "periodo anterior"}`,
    },
  ]
}

export function etiquetaPeriodoTexto(periodo: Periodo): string {
  if (periodo === "hoy") return "Hoy"
  if (periodo === "7d") return "Últimos 7 días"
  return "Últimos 30 días"
}
