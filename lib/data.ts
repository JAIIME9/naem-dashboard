import { municipioCoords, type PuntoMapa } from "./geo"
import {
  distribucionPerfiles,
  empresas,
  municipios,
  oportunidades,
  perfiles,
  serieOportunidades,
  zonasActividad,
} from "./mock-data"
import type {
  DistribucionPerfil,
  Empresa,
  Kpi,
  Municipio,
  Oportunidad,
  Perfil,
  Periodo,
  PuntoSerie,
  ZonaActividad,
} from "./types"

/**
 * Capa de acceso a datos de NAEM.
 *
 * Hoy devuelve datos mock. Para conectar Airtable, sustituye el cuerpo de cada
 * función por una llamada a la API backend (p. ej. `fetch("/api/oportunidades")`)
 * manteniendo estas firmas para no tocar la interfaz.
 */

export async function getOportunidades(): Promise<Oportunidad[]> {
  return oportunidades
}

export async function getOportunidadesRecientes(limite = 6): Promise<Oportunidad[]> {
  return [...oportunidades]
    .sort(
      (a, b) =>
        new Date(b.fechaDeteccion).getTime() - new Date(a.fechaDeteccion).getTime(),
    )
    .slice(0, limite)
}

export async function getEmpresas(): Promise<Empresa[]> {
  return empresas
}

export async function getPerfiles(): Promise<Perfil[]> {
  return perfiles
}

export async function getMunicipios(): Promise<Municipio[]> {
  return municipios
}

export async function getSerieOportunidades(): Promise<PuntoSerie[]> {
  return serieOportunidades
}

export async function getDistribucionPerfiles(): Promise<DistribucionPerfil[]> {
  return distribucionPerfiles
}

export async function getZonasActividad(): Promise<ZonaActividad[]> {
  return zonasActividad
}

export async function getActividadGeografica(): Promise<PuntoMapa[]> {
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
      oportunidades: v.oportunidades,
      empresas: v.empresas.size,
    }))
    .sort((a, b) => b.oportunidades - a.oportunidades)
}

const factorPeriodo: Record<Periodo, number> = {
  hoy: 0.12,
  "7d": 0.4,
  "30d": 1,
}

export async function getKpis(periodo: Periodo = "30d"): Promise<Kpi[]> {
  const f = factorPeriodo[periodo]
  const escala = (n: number) => Math.max(1, Math.round(n * f))
  return [
    {
      id: "nuevas",
      etiqueta: "Nuevas oportunidades",
      valor: escala(126),
      delta: escala(18),
      deltaEtiqueta: "esta semana",
    },
    {
      id: "empresas",
      etiqueta: "Empresas detectadas",
      valor: escala(84),
      delta: escala(12),
      deltaEtiqueta: "esta semana",
    },
    {
      id: "por-contactar",
      etiqueta: "Por contactar",
      valor: escala(47),
    },
    {
      id: "contactadas",
      etiqueta: "Contactadas",
      valor: escala(31),
      delta: escala(8),
      deltaEtiqueta: "esta semana",
    },
  ]
}
