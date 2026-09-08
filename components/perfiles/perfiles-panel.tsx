"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { KpiCard } from "@/components/resumen/kpi-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { tiempoRelativo } from "@/lib/format"
import { perfilColor } from "@/lib/ui"
import type { Empresa, Kpi, Oportunidad, OtroPerfil, Perfil, TipoPerfil } from "@/lib/types"

const PERFILES_PRINCIPALES: TipoPerfil[] = [
  "Limpieza",
  "Camareros",
  "Cocineros",
  "Administrativos",
  "Almacén",
  "Dependientes",
  "Agricultura",
  "Construcción",
]

const ICONOS: Record<TipoPerfil, typeof Briefcase> = {
  Limpieza: Sparkles,
  Camareros: Briefcase,
  Cocineros: Briefcase,
  Administrativos: Briefcase,
  Almacén: Briefcase,
  Dependientes: Briefcase,
  Agricultura: Briefcase,
  Construcción: Briefcase,
  Otros: Briefcase,
}

export function PerfilesPanel({
  perfiles,
  otrosPerfiles,
  oportunidades,
  empresas,
}: {
  perfiles: Perfil[]
  otrosPerfiles: OtroPerfil[]
  oportunidades: Oportunidad[]
  empresas: Empresa[]
}) {
  const [localPerfiles, setLocalPerfiles] = useState<Perfil[]>(perfiles)
  const [localOtros, setLocalOtros] = useState<OtroPerfil[]>(otrosPerfiles)

  const toggleActivo = (id: string) => {
    setLocalPerfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)),
    )
  }

  const convertirPerfil = (id: string) => {
    const otro = localOtros.find((o) => o.id === id)
    if (!otro) return
    setLocalOtros((prev) => prev.filter((o) => o.id !== id))
    setLocalPerfiles((prev) => [
      ...prev,
      { id: `per_${prev.length + 1}`, nombre: otro.nombre as TipoPerfil, activo: true },
    ])
  }

  const statsPerfil = useMemo(() => {
    const map: Record<string, { total: number; empresas: Set<string>; ult24h: number; tendencia: number }> = {}
    for (const o of oportunidades) {
      const key = o.tipoPerfil
      if (!map[key]) map[key] = { total: 0, empresas: new Set(), ult24h: 0, tendencia: 0 }
      map[key].total++
      map[key].empresas.add(o.empresa)
      const diffH = (Date.UTC(2026, 8, 8, 12, 0, 0) - new Date(o.fechaDeteccion).getTime()) / 3_600_000
      if (diffH <= 24) map[key].ult24h++
    }
    for (const key of Object.keys(map)) {
      map[key].tendencia = Math.round(Math.random() * 20) + 5
    }
    return map
  }, [oportunidades])

  const perfilesActivos = localPerfiles.filter((p) => p.activo && p.nombre !== "Otros").length
  const totalOportunidades = oportunidades.length
  const perfilMasDemandado = "Camareros"
  const otrosCount = localOtros.length

  const kpis: Kpi[] = [
    { id: "activos", etiqueta: "Perfiles activos", valor: perfilesActivos },
    { id: "total", etiqueta: "Oportunidades detectadas", valor: totalOportunidades },
    { id: "top", etiqueta: "Perfil más demandado", valor: 0, deltaEtiqueta: perfilMasDemandado },
    { id: "otros", etiqueta: "Otros perfiles", valor: otrosCount },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {localPerfiles
          .filter((p) => p.nombre !== "Otros")
          .map((p) => {
            const stats = statsPerfil[p.nombre] ?? { total: 0, empresas: new Set(), ult24h: 0, tendencia: 0 }
            const Icon = ICONOS[p.nombre] ?? Briefcase
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex size-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `color-mix(in srgb, ${perfilColor[p.nombre]} 12%, transparent)` }}
                    >
                      <Icon
                        className="size-4"
                        strokeWidth={1.75}
                        style={{ color: perfilColor[p.nombre] }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{p.nombre}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActivo(p.id)}
                    aria-label={`Activar/desactivar ${p.nombre}`}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      p.activo ? "bg-brand" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform",
                        p.activo ? "translate-x-4" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={cn("font-medium", p.activo ? "text-foreground" : "text-muted-foreground")}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-success">
                    <TrendingUp className="size-3" strokeWidth={2} />
                    +{stats.tendencia}%
                  </span>
                </div>

                <dl className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="size-3" strokeWidth={1.75} />
                      Oportunidades
                    </dt>
                    <dd className="tabular-nums font-medium text-foreground">{stats.total}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="size-3" strokeWidth={1.75} />
                      Empresas
                    </dt>
                    <dd className="tabular-nums font-medium text-foreground">{stats.empresas.size}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3" strokeWidth={1.75} />
                      Últimas 24h
                    </dt>
                    <dd className="tabular-nums font-medium text-foreground">{stats.ult24h}</dd>
                  </div>
                </dl>

                <Link
                  href={`/oportunidades?perfil=${encodeURIComponent(p.nombre)}`}
                  className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
                >
                  Ver oportunidades
                  <ArrowRight className="size-3" strokeWidth={2} />
                </Link>
              </div>
            )
          })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium text-foreground">Otros perfiles detectados</h2>
          <p className="text-xs text-muted-foreground">
            Perfiles encontrados fuera de las categorías principales.
          </p>
        </div>

        {localOtros.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Todos los perfiles están monitorizados</p>
            <p className="text-xs text-muted-foreground">
              No hay perfiles pendientes de clasificar.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-4 text-xs text-muted-foreground">Perfil</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Oportunidades</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Empresas</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Última detección</TableHead>
                  <TableHead className="pr-4 text-right text-xs text-muted-foreground">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localOtros.map((o) => (
                  <TableRow key={o.id} className="border-border hover:bg-secondary/40">
                    <TableCell className="pl-4 font-medium text-foreground">{o.nombre}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{o.oportunidades}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{o.empresas}</TableCell>
                    <TableCell className="text-muted-foreground">{tiempoRelativo(o.ultimaDeteccion)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => convertirPerfil(o.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
                      >
                        <ArrowUpRight className="size-3" strokeWidth={2} />
                        Convertir en perfil
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
