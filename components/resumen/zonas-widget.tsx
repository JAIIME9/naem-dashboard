import { MapPin } from "lucide-react"

import type { ZonaActividad } from "@/lib/types"

export function ZonasWidget({ data }: { data: ZonaActividad[] }) {
  const total = data.reduce((sum, item) => sum + item.valor, 0)
  const max = Math.max(...data.map((z) => z.valor), 1)

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="text-sm font-medium text-foreground">Actividad por provincia</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {total} oportunidades distribuidas en Valencia, Alicante, Murcia, Almería y Albacete
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {data.map((z) => {
          const porcentaje = total > 0 ? Math.round((z.valor / total) * 100) : 0
          return (
            <li key={z.zona} className="flex flex-col gap-1.5">
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{z.zona}</span>
                  <span className="text-xs text-muted-foreground">{porcentaje}% del total</span>
                </div>
                <span className="text-lg font-semibold tabular-nums text-foreground">{z.valor}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${(z.valor / max) * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
