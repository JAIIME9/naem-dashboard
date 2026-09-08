"use client"

import { useMemo, useState } from "react"
import { Building2, Globe, Mail, Phone, Search, SearchX, Target } from "lucide-react"

import { FilterSelect } from "@/components/filter-select"
import { EstadoComercialBadge } from "@/components/status-badge"
import { tiempoRelativo } from "@/lib/format"
import type { Empresa, EstadoComercial } from "@/lib/types"

const ESTADOS: EstadoComercial[] = [
  "Sin contactar",
  "En seguimiento",
  "Cliente",
  "Descartada",
]

export function EmpresasGrid({ data }: { data: Empresa[] }) {
  const [query, setQuery] = useState("")
  const [estado, setEstado] = useState("")
  const [sector, setSector] = useState("")

  const sectores = useMemo(
    () => [...new Set(data.map((e) => e.sector))].sort(),
    [data],
  )

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.filter((e) => {
      if (estado && e.estadoComercial !== estado) return false
      if (sector && e.sector !== sector) return false
      if (q && !`${e.nombre} ${e.municipio} ${e.sector}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [data, query, estado, sector])

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
            placeholder="Buscar empresa, sector o municipio…"
            aria-label="Buscar empresas"
            className="h-8 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <FilterSelect
          ariaLabel="Filtrar por estado comercial"
          placeholder="Todos los estados"
          value={estado}
          onChange={setEstado}
          options={ESTADOS.map((e) => ({ value: e, label: e }))}
          className="sm:w-44"
        />
        <FilterSelect
          ariaLabel="Filtrar por sector"
          placeholder="Todos los sectores"
          value={sector}
          onChange={setSector}
          options={sectores.map((s) => ({ value: s, label: s }))}
          className="sm:w-44"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtradas.length} {filtradas.length === 1 ? "empresa" : "empresas"}
        {filtradas.length !== data.length ? ` de ${data.length}` : ""}
      </p>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-16 text-center">
          <SearchX className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">Sin resultados</p>
          <p className="text-xs text-muted-foreground">
            Prueba a ajustar los filtros o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((e) => (
            <article
              key={e.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 hover:bg-secondary/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Building2 className="size-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="truncate font-medium text-foreground">{e.nombre}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.sector} · {e.municipio}
                    </p>
                  </div>
                </div>
                <EstadoComercialBadge estado={e.estadoComercial} />
              </div>

              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{e.web}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{e.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{e.email}</span>
                </div>
              </dl>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <Target className="size-3.5 text-brand" strokeWidth={2} />
                  {e.oportunidades} {e.oportunidades === 1 ? "oferta" : "ofertas"}
                </span>
                <span className="text-muted-foreground">
                  Actividad {tiempoRelativo(e.ultimaActividad).toLowerCase()}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
