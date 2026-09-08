import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Kpi } from "@/lib/types"

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{kpi.etiqueta}</p>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {kpi.valor.toLocaleString("es-ES")}
        </span>
        {typeof kpi.delta === "number" && (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success",
            )}
          >
            <ArrowUpRight className="size-3" strokeWidth={2.5} />
            {kpi.delta}
          </span>
        )}
      </div>
      {kpi.deltaEtiqueta ? (
        <p className="text-xs text-muted-foreground/80">
          <span className="text-success">+{kpi.delta}</span> {kpi.deltaEtiqueta}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/60">Sin gestionar todavía</p>
      )}
    </div>
  )
}
