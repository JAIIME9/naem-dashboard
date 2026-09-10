import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import type { Kpi } from "@/lib/types"

const KPI_HREFS: Record<string, string> = {
  nuevas: "/oportunidades",
  empresas: "/empresas",
  "por-contactar": "/empresas?estado=Sin%20contactar",
  contactadas: "/empresas?estado=En%20seguimiento",
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const href = KPI_HREFS[kpi.id] ?? "/"

  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm"
      aria-label={`Ver detalle de ${kpi.etiqueta}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{kpi.etiqueta}</p>
        <ArrowUpRight
          className="size-4 text-muted-foreground/45 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
          strokeWidth={1.8}
        />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {kpi.valor.toLocaleString("es-ES")}
        </span>
        {typeof kpi.delta === "number" && (
          <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
            <ArrowUpRight className="size-3" strokeWidth={2.5} />
            {kpi.delta}%
          </span>
        )}
      </div>
      {kpi.deltaEtiqueta ? (
        <p className="text-xs text-muted-foreground/80">
          {typeof kpi.delta === "number" && (
            <span className="text-success">+{kpi.delta}% </span>
          )}
          {kpi.deltaEtiqueta}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/60">Sin gestionar todavía</p>
      )}
    </Link>
  )
}
