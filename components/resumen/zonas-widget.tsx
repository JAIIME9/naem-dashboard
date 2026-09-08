import { MapPin } from "lucide-react"

import type { ZonaActividad } from "@/lib/types"

export function ZonasWidget({ data }: { data: ZonaActividad[] }) {
  const max = Math.max(...data.map((z) => z.valor), 1)

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="text-sm font-medium text-foreground">Actividad por zona</h2>
      </div>

      <ul className="mt-4 flex flex-col gap-3.5">
        {data.map((z) => (
          <li key={z.zona} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{z.zona}</span>
              <span className="tabular-nums text-muted-foreground">{z.valor}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${(z.valor / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
