// Referencia estable coherente con mock-data para calcular "hace X".
const AHORA = Date.UTC(2026, 8, 8, 12, 0, 0)

export function tiempoRelativo(iso: string): string {
  const diffMin = Math.round((AHORA - new Date(iso).getTime()) / 60_000)
  if (diffMin < 1) return "Ahora mismo"
  if (diffMin < 60) return `Hace ${diffMin} min`
  const horas = Math.round(diffMin / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return "Ayer"
  if (dias < 30) return `Hace ${dias} días`
  const meses = Math.round(dias / 30)
  return meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  })
}

export function fechaDia(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  })
}
