import type { DistribucionPerfil, Oportunidad, Periodo, TipoPerfil, ZonaActividad } from "./types"

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function titleCaseJob(value: unknown) {
  const text = clean(value).toLocaleLowerCase("es")
  return text.replace(/(^|[\s(/\-–—])([a-záéíóúüñ])/giu, (_m, sep, letter) => `${sep}${letter.toLocaleUpperCase("es")}`)
}

export function classifyProfile(...values: unknown[]): TipoPerfil {
  const s = normalize(values.filter(Boolean).join(" "))

  if (/\b(limpiador|limpiadora|limpieza|cleaner|housekeeping|camarer[ao] de pisos|personal de limpieza)\b/.test(s)) return "Limpieza"
  if (/\b(camarer[oa]s?|ayudante de camarer[oa]|waiter|waitress|barra|sala)\b/.test(s)) return "Camareros"
  if (/\b(cociner[oa]s?|chef|ayudante de cocina|pinche|cocina)\b/.test(s)) return "Cocineros"
  if (/\b(administrativ[oa]s?|auxiliar administrativ[oa]|recepcionista|secretari[oa]|office assistant|back office)\b/.test(s)) return "Administrativos"
  if (/\b(almacen|almac[eé]n|mozo|moza|logistica|logística|carretiller[oa]|preparador(?:a)? de pedidos|warehouse)\b/.test(s)) return "Almacén"
  if (/\b(dependient[ea]s?|vendedor(?:a)?|tienda|retail|shop assistant|sales assistant)\b/.test(s)) return "Dependientes"
  if (/\b(agricultura|agricola|agrícola|campo|peon agricola|peón agrícola|recolector(?:a)?|tractorista|jornalero)\b/.test(s)) return "Agricultura"
  if (/\b(construccion|construcción|obra civil|encargado de obra|oficial de obra|albanil|albañil|capataz|peon de obra|peón de obra)\b/.test(s)) return "Construcción"

  return "Otros"
}

export function filterOportunidadesPeriodo(items: Oportunidad[], periodo: Periodo) {
  const now = Date.now()
  const maxMs = periodo === "hoy" ? 86_400_000 : periodo === "7d" ? 7 * 86_400_000 : 30 * 86_400_000
  return items.filter((o) => {
    const t = new Date(o.fechaDeteccion).getTime()
    return Number.isFinite(t) ? now - t <= maxMs : periodo === "30d"
  })
}

export function buildProfileDistribution(items: Oportunidad[]): DistribucionPerfil[] {
  const map = new Map<TipoPerfil, number>()
  for (const o of items) {
    const perfil = classifyProfile(o.titulo, o.perfil, o.tipoPerfil)
    map.set(perfil, (map.get(perfil) || 0) + 1)
  }
  return [...map.entries()]
    .map(([tipoPerfil, valor]) => ({ tipoPerfil, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export function buildProvinceActivity(items: Oportunidad[]): ZonaActividad[] {
  const provincias = ["Valencia", "Alicante", "Murcia", "Almería", "Albacete"]
  const counts = new Map(provincias.map((p) => [p, 0]))
  for (const o of items) {
    const p = clean(o.provincia)
    if (counts.has(p)) counts.set(p, (counts.get(p) || 0) + 1)
  }
  return provincias.map((zona) => ({ zona, valor: counts.get(zona) || 0 }))
}
