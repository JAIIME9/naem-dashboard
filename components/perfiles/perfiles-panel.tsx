"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  ClipboardList,
  CookingPot,
  HardHat,
  Sparkles,
  Store,
  UtensilsCrossed,
  Warehouse,
  Wheat,
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
import { classifyProfile, titleCaseJob } from "@/lib/presentation"
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
  Camareros: UtensilsCrossed,
  Cocineros: CookingPot,
  Administrativos: ClipboardList,
  Almacén: Warehouse,
  Dependientes: Store,
  Agricultura: Wheat,
  Construcción: HardHat,
  Otros: Briefcase,
}

export function PerfilesPanel({
  perfiles,
  oportunidades,
}: {
  perfiles: Perfil[]
  otrosPerfiles: OtroPerfil[]
  oportunidades: Oportunidad[]
  empresas: Empresa[]
}) {
  const [localPerfiles, setLocalPerfiles] = useState<Perfil[]>(() =>
    PERFILES_PRINCIPALES.map((nombre) => {
      const existente = perfiles.find((p) => p.nombre === nombre)
      return existente ?? { id: `perfil_${nombre.toLowerCase()}`, nombre, activo: true }
    }),
  )

  const clasificadas = useMemo(
    () => oportunidades.map((o) => ({ ...o, tipoPresentacion: classifyProfile(o.titulo, o.perfil, o.tipoPerfil) })),
    [oportunidades],
  )

  const statsPerfil = useMemo(() => {
    const map: Record<string, { total: number; empresas: Set<string>; ult24h: number; porcentaje: number }> = {}
    for (const o of clasificadas) {
      const key = o.tipoPresentacion
      if (!map[key]) map[key] = { total: 0, empresas: new Set(), ult24h: 0, porcentaje: 0 }
      map[key].total += 1
      if (o.empresa) map[key].empresas.add(o.empresa)
      const t = new Date(o.fechaDeteccion).getTime()
      if (Number.isFinite(t) && Date.now() - t <= 86_400_000) map[key].ult24h += 1
    }
    const total = Math.max(clasificadas.length, 1)
    for (const key of Object.keys(map)) map[key].porcentaje = Math.round((map[key].total / total) * 100)
    return map
  }, [clasificadas])

  const otrosPerfiles = useMemo<OtroPerfil[]>(() => {
    const map = new Map<string, { oportunidades: number; empresas: Set<string>; ultima: string }>()
    for (const o of clasificadas.filter((x) => x.tipoPresentacion === "Otros")) {
      const rawPerfil = String(o.perfil || "").trim()
      const nombre = /^(otros|otros perfiles|otros perfiles bajo demanda)$/i.test(rawPerfil)
        ? titleCaseJob(o.titulo)
        : titleCaseJob(rawPerfil || o.titulo)
      const actual = map.get(nombre) ?? { oportunidades: 0, empresas: new Set<string>(), ultima: "" }
      actual.oportunidades += 1
      if (o.empresa) actual.empresas.add(o.empresa)
      if (!actual.ultima || o.fechaDeteccion > actual.ultima) actual.ultima = o.fechaDeteccion
      map.set(nombre, actual)
    }
    return [...map.entries()]
      .map(([nombre, v], index) => ({
        id: `otro_${index + 1}`,
        nombre,
        oportunidades: v.oportunidades,
        empresas: v.empresas.size,
        ultimaDeteccion: v.ultima,
      }))
      .sort((a, b) => b.oportunidades - a.oportunidades || a.nombre.localeCompare(b.nombre, "es"))
  }, [clasificadas])

  const toggleActivo = (id: string) => {
    setLocalPerfiles((prev) => prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)))
  }

  const perfilesActivos = localPerfiles.filter((p) => p.activo).length
  const top = PERFILES_PRINCIPALES
    .map((nombre) => ({ nombre, total: statsPerfil[nombre]?.total || 0 }))
    .sort((a, b) => b.total - a.total)[0]

  const kpis: Kpi[] = [
    { id: "activos", etiqueta: "Perfiles activos", valor: perfilesActivos },
    { id: "total", etiqueta: "Oportunidades detectadas", valor: oportunidades.length },
    { id: "top", etiqueta: "Perfil más demandado", valor: top?.total || 0, deltaEtiqueta: top?.nombre || "Sin datos" },
    { id: "otros", etiqueta: "Otros perfiles", valor: otrosPerfiles.length },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {localPerfiles.map((p) => {
          const stats = statsPerfil[p.nombre] ?? { total: 0, empresas: new Set<string>(), ult24h: 0, porcentaje: 0 }
          const Icon = ICONOS[p.nombre] ?? Briefcase
          return (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${perfilColor[p.nombre]} 12%, transparent)` }}
                  >
                    <Icon className="size-4" strokeWidth={1.75} style={{ color: perfilColor[p.nombre] }} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{p.nombre}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActivo(p.id)}
                  aria-label={`Activar/desactivar ${p.nombre}`}
                  className={cn("relative h-5 w-9 rounded-full transition-colors", p.activo ? "bg-brand" : "bg-border")}
                >
                  <span className={cn("absolute top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform", p.activo ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={cn("font-medium", p.activo ? "text-foreground" : "text-muted-foreground")}>
                  {p.activo ? "Activo" : "Inactivo"}
                </span>
                <span className="text-muted-foreground">{stats.porcentaje}% del total</span>
              </div>

              <dl className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="size-3" strokeWidth={1.75} />Oportunidades</dt>
                  <dd className="tabular-nums font-medium text-foreground">{stats.total}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="size-3" strokeWidth={1.75} />Empresas</dt>
                  <dd className="tabular-nums font-medium text-foreground">{stats.empresas.size}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3" strokeWidth={1.75} />Últimas 24h</dt>
                  <dd className="tabular-nums font-medium text-foreground">{stats.ult24h}</dd>
                </div>
              </dl>

              <Link
                href="/oportunidades"
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
          <p className="text-xs text-muted-foreground">Solo aparecen aquí los puestos que no encajan en las ocho categorías principales.</p>
        </div>

        {otrosPerfiles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Todos los perfiles están clasificados</p>
            <p className="text-xs text-muted-foreground">No hay perfiles pendientes de clasificar.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-4 text-xs text-muted-foreground">Perfil</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Oportunidades</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Empresas</TableHead>
                  <TableHead className="pr-4 text-xs text-muted-foreground">Última detección</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otrosPerfiles.map((o) => (
                  <TableRow key={o.id} className="border-border hover:bg-secondary/40">
                    <TableCell className="pl-4 font-medium text-foreground">{o.nombre}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{o.oportunidades}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{o.empresas}</TableCell>
                    <TableCell className="pr-4 text-muted-foreground">{tiempoRelativo(o.ultimaDeteccion)}</TableCell>
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
