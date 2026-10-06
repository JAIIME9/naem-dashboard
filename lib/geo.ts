import type { Oportunidad } from "./types"

export interface PuntoMapa {
  municipio: string
  provincia: string
  lat: number
  lng: number
  oportunidades: number
  empresas: number
  aproximado?: boolean
}

export const municipioCoords: Record<string, { lat: number; lng: number }> = {
  Alicante: { lat: 38.3452, lng: -0.481 },
  Elche: { lat: 38.2669, lng: -0.6983 },
  Orihuela: { lat: 38.0849, lng: -0.9445 },
  Benidorm: { lat: 38.5411, lng: -0.1225 },
  Murcia: { lat: 37.9922, lng: -1.1307 },
  Valencia: { lat: 39.4699, lng: -0.3763 },
  València: { lat: 39.4699, lng: -0.3763 },
  Torrevieja: { lat: 37.9787, lng: -0.6822 },
  Almería: { lat: 36.834, lng: -2.4637 },
  Cartagena: { lat: 37.6257, lng: -0.9966 },
  Lorca: { lat: 37.6712, lng: -1.7017 },
  Dénia: { lat: 38.8408, lng: 0.1057 },
  Denia: { lat: 38.8408, lng: 0.1057 },
  Gandia: { lat: 38.9686, lng: -0.1844 },
  Carcaixent: { lat: 39.1218, lng: -0.4481 },
  Camporrobles: { lat: 39.6466, lng: -1.3967 },
  Benijófar: { lat: 38.0778, lng: -0.7371 },
  Beniel: { lat: 38.0464, lng: -1.0023 },
  Bullas: { lat: 38.0467, lng: -1.6723 },
  Sierro: { lat: 37.322, lng: -2.398 },
  "Olula del Río": { lat: 37.3547, lng: -2.2975 },
  "Mojonera, La": { lat: 36.7532, lng: -2.6853 },
  "La Mojonera": { lat: 36.7532, lng: -2.6853 },
  "Gallardos, Los": { lat: 37.1681, lng: -1.9396 },
  "Los Gallardos": { lat: 37.1681, lng: -1.9396 },
  Albacete: { lat: 38.9943, lng: -1.8585 },
  Hellín: { lat: 38.5106, lng: -1.7009 },
  Almansa: { lat: 38.869, lng: -1.0972 },
  Villarrobledo: { lat: 39.2669, lng: -2.6011 },
  "La Roda": { lat: 39.2072, lng: -2.1586 },
  "Roda, La": { lat: 39.2072, lng: -2.1586 },
  Caudete: { lat: 38.7036, lng: -0.9876 },
}

const provinceCenters: Record<string, { lat: number; lng: number }> = {
  Valencia: { lat: 39.35, lng: -0.55 },
  Alicante: { lat: 38.4, lng: -0.55 },
  Murcia: { lat: 37.95, lng: -1.25 },
  Almería: { lat: 37.05, lng: -2.35 },
  Albacete: { lat: 38.85, lng: -1.95 },
}

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function coordsForMunicipio(municipio: string, provincia: string) {
  const exact = municipioCoords[municipio]
  if (exact) return { ...exact, aproximado: false }

  const base = provinceCenters[provincia]
  if (!base) return null

  const h = hash(`${provincia}|${municipio}`)
  const angle = ((h % 360) * Math.PI) / 180
  const radius = 0.08 + ((h >>> 8) % 100) / 1000
  return {
    lat: base.lat + Math.sin(angle) * radius,
    lng: base.lng + Math.cos(angle) * radius,
    aproximado: true,
  }
}

export function buildActividadPoints(items: Oportunidad[]): PuntoMapa[] {
  const map = new Map<string, { municipio: string; provincia: string; oportunidades: number; empresas: Set<string> }>()

  for (const o of items) {
    if (!o.municipio || !o.provincia) continue
    const key = `${o.provincia}|${o.municipio}`
    const current = map.get(key) ?? {
      municipio: o.municipio,
      provincia: o.provincia,
      oportunidades: 0,
      empresas: new Set<string>(),
    }
    current.oportunidades += 1
    if (o.empresa) current.empresas.add(o.empresa)
    map.set(key, current)
  }

  return [...map.values()]
    .map((v) => {
      const coords = coordsForMunicipio(v.municipio, v.provincia)
      if (!coords) return null
      return {
        municipio: v.municipio,
        provincia: v.provincia,
        lat: coords.lat,
        lng: coords.lng,
        oportunidades: v.oportunidades,
        empresas: v.empresas.size,
        aproximado: coords.aproximado,
      } satisfies PuntoMapa
    })
    .filter((p): p is PuntoMapa => Boolean(p))
    .sort((a, b) => b.oportunidades - a.oportunidades)
}

export const centroMapa: [number, number] = [38.4, -1.2]
