"use client"

import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"

import type { PuntoMapa } from "@/lib/geo"

const ActividadMap = dynamic(() => import("./actividad-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-secondary/60">
      <span className="text-sm text-muted-foreground">Cargando mapa…</span>
    </div>
  ),
})

export function MapaPanel({ points }: { points: PuntoMapa[] }) {
  const totalOportunidades = points.reduce((acc, p) => acc + p.oportunidades, 0)
  const max = Math.max(...points.map((p) => p.oportunidades), 1)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
        <div className="h-[420px] w-full lg:h-[560px]">
          <ActividadMap points={points} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" strokeWidth={1.75} />
            <h2 className="text-sm font-medium text-foreground">Municipios activos</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {points.length} municipios · {totalOportunidades} oportunidades
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {points.map((p) => (
              <li key={p.municipio} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{p.municipio}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {p.oportunidades}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(p.oportunidades / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {p.empresas} {p.empresas === 1 ? "empresa" : "empresas"} · {p.provincia}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
