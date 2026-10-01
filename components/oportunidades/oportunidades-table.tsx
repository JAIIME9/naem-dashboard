"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  Search,
  SearchX,
  Tag,
  X,
} from "lucide-react"

import { FilterSelect } from "@/components/filter-select"
import { EstadoBadge } from "@/components/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fechaCorta, tiempoRelativo } from "@/lib/format"
import { titleCaseJob } from "@/lib/presentation"
import type { EstadoOportunidad, Oportunidad } from "@/lib/types"

const ESTADOS: EstadoOportunidad[] = ["Nueva", "Contactada"]

export function OportunidadesTable({ data }: { data: Oportunidad[] }) {
  const searchParams = useSearchParams()
  const initialMunicipio = searchParams.get("municipio") ?? ""
  const initialOportunidad = searchParams.get("oportunidad") ?? ""

  const [query, setQuery] = useState("")
  const [estado, setEstado] = useState("")
  const [provincia, setProvincia] = useState("")
  const [municipio, setMunicipio] = useState(initialMunicipio)
  const [fuente, setFuente] = useState("")
  const [fechaFiltro, setFechaFiltro] = useState("")
  const [selected, setSelected] = useState<Oportunidad | null>(() =>
    data.find((o) => o.id === initialOportunidad) ?? null,
  )
  const [localData, setLocalData] = useState<Oportunidad[]>(data)

  const provincias = useMemo(
    () => [...new Set(localData.map((o) => o.provincia).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [localData],
  )

  const municipios = useMemo(() => {
    const base = provincia ? localData.filter((o) => o.provincia === provincia) : localData
    return [...new Set(base.map((o) => o.municipio).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"))
  }, [localData, provincia])

  const fuentes = useMemo(
    () => [...new Set(localData.map((o) => o.fuente).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [localData],
  )

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return localData.filter((o) => {
      if (estado && o.estado !== estado) return false
      if (provincia && o.provincia !== provincia) return false
      if (municipio && o.municipio !== municipio) return false
      if (fuente && o.fuente !== fuente) return false
      if (fechaFiltro) {
        const fecha = new Date(o.fechaDeteccion).getTime()
        const diffDias = Math.floor((Date.now() - fecha) / 86_400_000)
        if (fechaFiltro === "hoy" && diffDias > 0) return false
        if (fechaFiltro === "7d" && diffDias > 7) return false
        if (fechaFiltro === "30d" && diffDias > 30) return false
      }
      if (q) {
        const blob = `${o.titulo} ${o.empresa} ${o.perfil} ${o.municipio} ${o.provincia}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [localData, query, estado, provincia, municipio, fuente, fechaFiltro])

  const hasFiltros = estado || provincia || municipio || fuente || fechaFiltro || query

  const limpiarFiltros = () => {
    setQuery("")
    setEstado("")
    setProvincia("")
    setMunicipio("")
    setFuente("")
    setFechaFiltro("")
  }

  const cambiarProvincia = (value: string) => {
    setProvincia(value)
    setMunicipio("")
  }

  const updateEstado = (id: string, nuevoEstado: EstadoOportunidad) => {
    setLocalData((prev) => prev.map((o) => (o.id === id ? { ...o, estado: nuevoEstado } : o)))
    setSelected((prev) => (prev?.id === id ? { ...prev, estado: nuevoEstado } : prev))
  }

  const updateNotas = (id: string, notas: string) => {
    setLocalData((prev) => prev.map((o) => (o.id === id ? { ...o, notas } : o)))
    setSelected((prev) => (prev?.id === id ? { ...prev, notas } : prev))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-64">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por puesto, empresa o municipio…"
            aria-label="Buscar oportunidades"
            className="h-8 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <FilterSelect
          ariaLabel="Filtrar por estado"
          placeholder="Todos los estados"
          value={estado}
          onChange={setEstado}
          options={ESTADOS.map((e) => ({ value: e, label: e }))}
          className="sm:w-40"
        />

        <FilterSelect
          ariaLabel="Filtrar por provincia"
          placeholder="Todas las provincias"
          value={provincia}
          onChange={cambiarProvincia}
          options={provincias.map((p) => ({ value: p, label: p }))}
          className="sm:w-40"
        />

        <FilterSelect
          ariaLabel="Filtrar por municipio"
          placeholder="Todos los municipios"
          value={municipio}
          onChange={setMunicipio}
          options={municipios.map((m) => ({ value: m, label: m }))}
          className="sm:w-44"
        />

        <FilterSelect
          ariaLabel="Filtrar por fuente"
          placeholder="Todas las fuentes"
          value={fuente}
          onChange={setFuente}
          options={fuentes.map((f) => ({ value: f, label: f }))}
          className="sm:w-40"
        />

        <FilterSelect
          ariaLabel="Filtrar por fecha"
          placeholder="Cualquier fecha"
          value={fechaFiltro}
          onChange={setFechaFiltro}
          options={[
            { value: "hoy", label: "Hoy" },
            { value: "7d", label: "Últimos 7 días" },
            { value: "30d", label: "Últimos 30 días" },
          ]}
          className="sm:w-40"
        />

        {hasFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" strokeWidth={2} />
            Limpiar filtros
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtradas.length} {filtradas.length === 1 ? "oportunidad" : "oportunidades"}
        {filtradas.length !== localData.length ? ` de ${localData.length}` : ""}
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-4 text-xs text-muted-foreground">Puesto</TableHead>
              <TableHead className="text-xs text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs text-muted-foreground">Municipio</TableHead>
              <TableHead className="text-xs text-muted-foreground">Provincia</TableHead>
              <TableHead className="text-xs text-muted-foreground">Fuente</TableHead>
              <TableHead className="text-xs text-muted-foreground">Detectada</TableHead>
              <TableHead className="text-xs text-muted-foreground">Estado</TableHead>
              <TableHead className="pr-4 text-right text-xs text-muted-foreground">Oferta</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtradas.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer border-border hover:bg-secondary/40"
                onClick={() => setSelected(o)}
              >
                <TableCell className="max-w-64 pl-4">
                  <span className="truncate font-medium text-foreground">{titleCaseJob(o.titulo)}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{o.empresa}</TableCell>
                <TableCell className="text-muted-foreground">{o.municipio}</TableCell>
                <TableCell className="text-muted-foreground">{o.provincia}</TableCell>
                <TableCell className="text-muted-foreground">{o.fuente}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span title={fechaCorta(o.fechaDeteccion)}>{tiempoRelativo(o.fechaDeteccion)}</span>
                </TableCell>
                <TableCell><EstadoBadge estado={o.estado} /></TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={o.urlOferta}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir oferta: ${o.titulo}`}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" strokeWidth={1.75} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtradas.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <SearchX className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">Sin resultados</p>
            <p className="text-xs text-muted-foreground">Prueba a ajustar los filtros o el término de búsqueda.</p>
          </div>
        )}
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? titleCaseJob(selected.titulo) : undefined}>
        {selected && (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-2">
              <EstadoBadge estado={selected.estado} />
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <Building2 className="size-4" strokeWidth={1.75} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-foreground">{selected.empresa}</span>
                <span className="text-xs text-muted-foreground">{selected.perfil}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={MapPin} label="Municipio" value={selected.municipio} />
              <DetailItem icon={Tag} label="Perfil" value={selected.tipoPerfil} />
              <DetailItem icon={MapPin} label="Provincia" value={selected.provincia} />
              <DetailItem icon={FileText} label="Fuente" value={selected.fuente} />
              <DetailItem icon={Calendar} label="Publicación" value={fechaCorta(selected.fechaPublicacion)} />
              <DetailItem icon={Calendar} label="Detección" value={fechaCorta(selected.fechaDeteccion)} />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Descripción</p>
              <p className="text-sm leading-relaxed text-foreground">{selected.descripcion}</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Notas</p>
              <textarea
                value={selected.notas}
                onChange={(e) => updateNotas(selected.id, e.target.value)}
                placeholder="Añadir notas internas…"
                rows={3}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {selected.estado !== "Contactada" && (
              <Button variant="outline" size="sm" onClick={() => updateEstado(selected.id, "Contactada")}>
                Marcar como contactada
              </Button>
            )}

            <a
              href={selected.urlOferta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
            >
              <ExternalLink className="size-4" strokeWidth={1.75} />
              Abrir oferta original
            </a>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3" strokeWidth={1.75} />
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}
