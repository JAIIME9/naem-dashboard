"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"

import { FilterSelect } from "@/components/filter-select"
import { PeriodSelector } from "@/components/period-selector"
import { classifyProfile } from "@/lib/presentation"
import type { PuntoMapa } from "@/lib/geo"
import type { Oportunidad, Periodo } from "@/lib/types"

const ActividadMap = dynamic(() => import("./actividad-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-secondary/60">
      <span className="text-sm text-muted-foreground">Cargando mapa…</span>
    </div>
  ),
})

export function MapaPanel({
  points,
  oportunidades,
  periodo,
}: {
  points: PuntoMapa[]
  oportunidades: Oportunidad[]
  periodo: Periodo
}) {
  const [perfil, setPerfil] = useState("")
  const [provincia, setProvincia] = useState("")

  const tiposPerfil = useMemo(
    () => [...new Set(oportunidades.map((o) => classifyProfile(o.titulo, o.perfil, o.tipoPerfil)))].sort(),
    [oportunidades],
  )
  const provincias = useMemo(
    () => [...new Set(oportunidades.map((o) => o.provincia).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [oportunidades],
  )

  const filteredPoints = useMemo(() => {
    if (!perfil && !provincia) return points
    return points.filter((p) => {
      const opps = oportunidades.filter((o) => o.municipio === p.municipio && o.provincia === p.provincia)
      if (perfil && !opps.some((o) => classifyProfile(o.titulo, o.perfil, o.tipoPerfil) === perfil)) return false
      if (provincia && p.provincia !== provincia) return false
      return true
    })
  }, [points, oportunidades, perfil, provincia])

  const totalOportunidades = filteredPoints.reduce((acc, p) => acc + p.oportunidades, 0)
  const totalEmpresas = new Set(
    oportunidades
      .filter((o) => (!provincia || o.provincia === provincia) && (!perfil || classifyProfile(o.titulo, o.perfil, o.tipoPerfil) === perfil))
      .map((o) => o.empresa)
      .filter(Boolean),
  ).size
  const max = Math.max(...filteredPoints.map((p) => p.oportunidades), 1)
  const topMunicipios = filteredPoints.slice(0, 12)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect
          ariaLabel="Filtrar por perfil"
          placeholder="Todos los perfiles"
          value={perfil}
          onChange={setPerfil}
          options={tiposPerfil.map((t) => ({ value: t, label: t }))}
          className="sm:w-40"
        />
        <FilterSelect
          ariaLabel="Filtrar por provincia"
          placeholder="Todas las provincias"
          value={provincia}
          onChange={setProvincia}
          options={provincias.map((p) => ({ value: p, label: p }))}
          className="sm:w-40"
        />
        <div className="sm:ml-auto">
          <PeriodSelector value={periodo} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{totalOportunidades}</span> oportunidades ·{" "}
        <span className="font-medium text-foreground">{totalEmpresas}</span> empresas ·{" "}
        <span className="font-medium text-foreground">{filteredPoints.length}</span> municipios
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
          <div className="h-[420px] w-full lg:h-[560px]">
            <ActividadMap points={filteredPoints} oportunidades={oportunidades} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <h2 className="text-sm font-medium text-foreground">Municipios con más actividad</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredPoints.length} municipios · {totalOportunidades} oportunidades
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {topMunicipios.map((p) => {
                const topPerfiles = oportunidades
                  .filter((o) => o.municipio === p.municipio && o.provincia === p.provincia)
                  .reduce<Record<string, number>>((acc, o) => {
                    const tipo = classifyProfile(o.titulo, o.perfil, o.tipoPerfil)
                    acc[tipo] = (acc[tipo] || 0) + 1
                    return acc
                  }, {})
                const top3 = Object.entries(topPerfiles).sort((a, b) => b[1] - a[1]).slice(0, 3)

                return (
                  <li key={`${p.provincia}-${p.municipio}`} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{p.municipio}</span>
                      <span className="tabular-nums text-muted-foreground">{p.oportunidades}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(p.oportunidades / max) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {p.empresas} {p.empresas === 1 ? "empresa" : "empresas"} · {p.provincia}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {top3.map((t) => t[0]).join(" · ")}
                      </span>
                    </div>
                    <Link
                      href={`/oportunidades?municipio=${encodeURIComponent(p.municipio)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
                    >
                      Ver oportunidades
                      <ArrowRight className="size-3" strokeWidth={2} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
