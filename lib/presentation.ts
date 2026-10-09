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

// NAEM: clasificación de puestos en los 8 perfiles + "Otros".
const PERFIL_REGLAS: [TipoPerfil, RegExp[]][] = [
  ["Limpieza", [/\blimpi(?:ador|adora|adores|adoras|eza|ezas)\b/, /\bcamarer[oa]s? de pisos\b/, /\bhousekeeping\b/, /\bcristaler[oa]s?\b/, /\bgobernant[ae]s?\b/, /\bcleaners?\b/, /\bcleaning\b/]],
  ["Cocineros", [/\bcocin(?:er[oa]s?|a)\b/, /\bayudante de cocina\b/, /\bchefs?\b/, /\bpinches?\b/, /\bpizzer[oa]s?\b/, /\bparriller[oa]s?\b/, /\bfr[ie]+gaplatos\b/, /\bsushiman\b/, /\bcooks?\b/, /\bkitchen\b/, /\bjefe de partida\b/, /\bpanader[oa]s?\b/, /\bpasteler[oa]s?\b/, /\bobrador\b/]],
  ["Camareros", [/\bcamarer[oa]s?\b/, /\bbaristas?\b/, /\bbarman\b/, /\bbartenders?\b/, /\bwaiters?\b/, /\bwaitress\b/, /\bmaitre\b/, /\bmetre\b/, /\b(?:jefe|ayudante|personal|encargad[oa]) de sala\b/, /\brunners?\b/, /\bmeser[oa]s?\b/]],
  ["Administrativos", [/\badministrativ[oa]s?\b/, /\brecepcionistas?\b/, /\bsecretari[oa]s?\b/, /\bcontables?\b/, /\bback office\b/, /\bfacturacion\b/, /\badministracion\b/, /\bauxiliar de oficina\b/, /\boficina\b/, /\bdata entry\b/, /\bgrabador(?:a|es|as)? de datos\b/]],
  ["Almacén", [/\balmacen(?:es)?\b/, /\balmacener[oa]s?\b/, /\bmoz[oa]s?\b/, /\bcarretiller[oa]s?\b/, /\bpreparador(?:a|es|as)? de pedidos\b/, /\bpicking\b/, /\bpickers?\b/, /\blogistic[oa]s?\b/, /\blogistica\b/, /\bwarehouse\b/, /\bcarga y descarga\b/, /\bexpediciones\b/, /\breponedor(?:a|es|as)?\b/]],
  ["Dependientes", [/\bdependient[ae]s?\b/, /\bcajer[oa]s?\b/, /\bvendedor(?:a|es|as)?\b/, /\b(?:shop|sales|store|retail) assistants?\b/, /\bauxiliar de tienda\b/, /\bpersonal de tienda\b/, /\bcharcuter[oa]s?\b/, /\bcarnicer[oa]s?\b/, /\bpescader[oa]s?\b/, /\bfruter[oa]s?\b/]],
  ["Agricultura", [/\bagricol[ae]s?\b/, /\bagrari[oa]s?\b/, /\b(?:peon|peones|operari[oa]s?|trabajador(?:a|es|as)?) de campo\b/, /\brecolector(?:a|es|as)?\b/, /\brecoleccion\b/, /\btractoristas?\b/, /\binvernaderos?\b/, /\bjornaler[oa]s?\b/, /\btemporer[oa]s?\b/, /\bjardiner[oa]s?\b/, /\bjardineria\b/, /\bhortofruticol[ao]s?\b/, /\bmanipulador(?:a|es|as)? de (?:fruta|frutas|verdura|verduras|hortalizas|citricos)\b/, /\benvasador(?:a|es|as)? de (?:fruta|frutas|verdura|verduras|hortalizas)\b/, /\bpodador(?:a|es|as)?\b/, /\bvendimia\b/, /\bganader[oa]s?\b/]],
  ["Construcción", [/\bconstruccion\b/, /\balbanil(?:es)?\b/, /\bpeon(?:es)? (?:de obra|de la construccion|de construccion|de albanil)\b/, /\bobra civil\b/, /\bencofrador(?:a|es|as)?\b/, /\bferrallistas?\b/, /\bfontaner[oa]s?\b/, /\belectricistas?\b/, /\boficial(?:es)? de (?:obra|albanil|(?:1|2|1a|2a|primera|segunda) (?:de )?(?:albanil|construccion|obra))\b/, /\bcapataz\b/, /\bgruistas?\b/, /\byeser[oa]s?\b/, /\bsolador(?:es)?\b/, /\balicatador(?:es)?\b/, /\bpintor(?:a|es|as)?\b/, /\bescayolistas?\b/, /\b(?:jefe|encargad[oa]) de obra\b/, /\bcarpinter[oa]s?\b/, /\bpladur\b/, /\bandamier[oa]s?\b/, /\bsoldador(?:a|es|as)?\b/]],
]

function perfilNorm(v: unknown) {
  return String(v == null ? "" : v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ").replace(/ñ/g, "n").replace(/\s+/g, " ").trim()
}

// Busca el primer puesto que aparece en el texto (si empatan, el más largo).
export function perfilDesdeTexto(texto: unknown): TipoPerfil | "" {
  const s = perfilNorm(texto)
  if (!s) return ""
  let mejor: { perfil: TipoPerfil; pos: number; len: number } | null = null
  for (const [perfil, reglas] of PERFIL_REGLAS) {
    for (const re of reglas) {
      const m = re.exec(s)
      if (!m) continue
      if (!mejor || m.index < mejor.pos || (m.index === mejor.pos && m[0].length > mejor.len)) {
        mejor = { perfil, pos: m.index, len: m[0].length }
      }
    }
  }
  return mejor ? mejor.perfil : ""
}

// En la descripción solo vale si un perfil aparece al menos 2 veces y gana claramente.
export function perfilDesdeDescripcion(texto: unknown): TipoPerfil | "" {
  const s = perfilNorm(texto)
  if (!s) return ""
  const cuenta: [TipoPerfil, number][] = []
  for (const [perfil, reglas] of PERFIL_REGLAS) {
    let n = 0
    for (const re of reglas) n += (s.match(new RegExp(re.source, "g")) || []).length
    if (n) cuenta.push([perfil, n])
  }
  cuenta.sort((a, b) => b[1] - a[1])
  if (!cuenta.length || cuenta[0][1] < 2 || (cuenta[1] && cuenta[1][1] === cuenta[0][1])) return ""
  return cuenta[0][0]
}

export function clasificarPerfil(titulo: unknown, descripcion?: unknown): TipoPerfil {
  return perfilDesdeTexto(titulo) || perfilDesdeDescripcion(descripcion) || "Otros"
}

const PERFILES_VALIDOS: TipoPerfil[] = ["Limpieza", "Camareros", "Cocineros", "Administrativos", "Almacén", "Dependientes", "Agricultura", "Construcción", "Otros"]

// Clasifica con el primer texto que identifique un puesto (título, perfil detectado...).
// Si un valor ya es el nombre de un perfil NAEM (lo guarda el workflow desde la V9.4.6), se respeta.
export function classifyProfile(...values: unknown[]): TipoPerfil {
  for (const value of values) {
    const directo = PERFILES_VALIDOS.find((p) => normalize(p) === normalize(value))
    if (directo && directo !== "Otros") return directo
    const perfil = perfilDesdeTexto(value)
    if (perfil) return perfil
  }
  return "Otros"
}

// "Sanitas — Auxiliar administrativo" -> "Auxiliar administrativo"
export function tituloPuesto(value: unknown) {
  const s = clean(value).replace(/^\[REVISAR\]\s*/i, "")
  const partes = s.split(/\s+—\s+/)
  return partes.length >= 2 ? clean(partes.slice(1).join(" — ")) : s
}

// "a través de Jobijoba" -> "Jobijoba"
export function limpiarFuente(value: unknown) {
  return clean(value).replace(/^(?:a\s+trav[eé]s\s+de|v[ií]a)\s+/i, "")
}

// Solo móviles españoles (6xx / 71x-74x). Devuelve 9 dígitos o "".
export function movilWhatsapp(value: unknown) {
  let d = clean(value).replace(/\D+/g, "")
  if (d.startsWith("0034")) d = d.slice(4)
  else if (d.length === 11 && d.startsWith("34")) d = d.slice(2)
  return /^(?:6\d{8}|7[1-4]\d{7})$/.test(d) ? d : ""
}

export function formatoTelefono(movil: string) {
  return movil.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3")
}

function puestoEnFrase(puesto: string) {
  let p = clean(puesto).replace(/\([^)]*\)/g, " ").split(/\s+[-–—|]\s+/)[0].replace(/\s+/g, " ").trim()
  if (["personal", "otros"].includes(p.toLowerCase())) return ""
  if (p && p === p.toUpperCase()) p = p.toLowerCase()
  else if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]/.test(p)) p = p.charAt(0).toLowerCase() + p.slice(1)
  return p
}

// Mensaje por defecto de WhatsApp, en el mismo tono que el email.
export function mensajeWhatsapp(empresa: string, puesto?: string) {
  const p = puestoEnFrase(puesto || "")
  const vacante = p
    ? `Hemos visto que están buscando personal para el puesto de ${p}. Disponemos de personal cualificado y con disponibilidad inmediata para cubrir este puesto, y podemos presentarles candidatos que se ajusten al perfil que necesitan.`
    : "Disponemos de personal cualificado y con disponibilidad inmediata para cubrir su vacante, y podemos presentarles candidatos que se ajusten al perfil que necesitan."
  return [
    `Buenos días, equipo de ${clean(empresa) || "su empresa"}.`,
    "Nos ponemos en contacto con ustedes desde NAEM, empresa dedicada a la selección y cesión de personal.",
    vacante,
    "Si les interesa, pueden respondernos por aquí y les enviaremos los perfiles disponibles.",
    "Un cordial saludo,\nDepartamento Comercial | NAEM",
  ].join("\n\n")
}

// En ordenador abre WhatsApp Web; en el móvil, la app.
export function urlWhatsapp(movil: string, texto: string) {
  const esMovil = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  const base = esMovil ? "https://api.whatsapp.com/send" : "https://web.whatsapp.com/send"
  return `${base}?phone=34${movil}&text=${encodeURIComponent(texto)}`
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
