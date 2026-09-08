"use client"

import { useMemo, useState } from "react"
import { ExternalLink, Search, SearchX } from "lucide-react"

import { FilterSelect } from "@/components/filter-select"
import { EstadoBadge } from "@/components/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fechaCorta, tiempoRelativo } from "@/lib/format"
import { prioridadStyle } from "@/lib/ui"
import type { EstadoOportunidad, Oportunidad } from "@/lib/types"

const ESTADOS: EstadoOportunidad[] = [
  "Nueva",
  "Revisada",
  "Contactada",
  "Interesante",
  "Descartada",
]

export function OportunidadesTable({ data }: { data: Oportunidad[] }) {
  const [query, setQuery] = useState("")
  const [estado, setEstado] = useState("")
  const [tipoPerfil, setTipoPerfil] = useState("")
  const [zona, setZona] = useState("")

  const tiposPerfil = useMemo(
    () => [...new Set(data.map((o) => o.tipoPerfil))].sort(),
    [data],
  )
  const zonas = useMemo(() => [...new Set(data.map((o) => o.zona))].sort(), [data])

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.filter((o) => {
      if (estado && o.estado !== estado) return false
      if (tipoPerfil && o.tipoPerfil !== tipoPerfil) return false
      if (zona && o.zona !== zona) return false
      if (q) {
        const blob = `${o.titulo} ${o.empresa} ${o.perfil} ${o.municipio}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [data, query, estado, tipoPerfil, zona])

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
          className="sm:w-44"
        />
        <FilterSelect
          ariaLabel="Filtrar por perfil"
          placeholder="Todos los perfiles"
          value={tipoPerfil}
          onChange={setTipoPerfil}
          options={tiposPerfil.map((t) => ({ value: t, label: t }))}
          className="sm:w-44"
        />
        <FilterSelect
          ariaLabel="Filtrar por zona"
          placeholder="Todas las zonas"
          value={zona}
          onChange={setZona}
          options={zonas.map((z) => ({ value: z, label: z }))}
          className="sm:w-40"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtradas.length}{" "}
        {filtradas.length === 1 ? "oportunidad" : "oportunidades"}
        {filtradas.length !== data.length ? ` de ${data.length}` : ""}
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-4 text-xs text-muted-foreground">Puesto</TableHead>
              <TableHead className="text-xs text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs text-muted-foreground">Perfil</TableHead>
              <TableHead className="text-xs text-muted-foreground">Municipio</TableHead>
              <TableHead className="text-xs text-muted-foreground">Fuente</TableHead>
              <TableHead className="text-xs text-muted-foreground">Estado</TableHead>
              <TableHead className="text-xs text-muted-foreground">Detectada</TableHead>
              <TableHead className="pr-4 text-right text-xs text-muted-foreground">
                Oferta
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((o) => (
              <TableRow key={o.id} className="border-border hover:bg-secondary/40">
                <TableCell className="max-w-56 pl-4">
                  <div className="flex flex-col">
                    <span className="truncate font-medium text-foreground">
                      {o.titulo}
                    </span>
                    <span className={`text-xs ${prioridadStyle[o.prioridad]}`}>
                      Prioridad {o.prioridad.toLowerCase()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{o.empresa}</TableCell>
                <TableCell className="text-muted-foreground">{o.tipoPerfil}</TableCell>
                <TableCell className="text-muted-foreground">{o.municipio}</TableCell>
                <TableCell className="text-muted-foreground">{o.fuente}</TableCell>
                <TableCell>
                  <EstadoBadge estado={o.estado} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span title={fechaCorta(o.fechaDeteccion)}>
                    {tiempoRelativo(o.fechaDeteccion)}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-right">
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
            <p className="text-xs text-muted-foreground">
              Prueba a ajustar los filtros o el término de búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
