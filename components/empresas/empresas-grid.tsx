"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  Globe,
  HardHat,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  SearchX,
  Send,
  Sparkles,
  Store,
  Tag,
  Target,
  UtensilsCrossed,
  Warehouse,
  Wheat,
} from "lucide-react"

import { FilterSelect } from "@/components/filter-select"
import { EstadoComercialBadge } from "@/components/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { tiempoRelativo, fechaCorta } from "@/lib/format"
import type { Empresa, EstadoComercial, Oportunidad, TipoPerfil } from "@/lib/types"

const ESTADOS: EstadoComercial[] = [
  "Sin contactar",
  "En seguimiento",
  "Cliente",
  "Descartada",
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

function PerfilLogo({ tipoPerfil = "Otros" }: { tipoPerfil?: TipoPerfil }) {
  const Icon = ICONOS[tipoPerfil] ?? Briefcase
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/70 text-brand shadow-sm">
      <Icon className="size-5" strokeWidth={1.8} />
    </div>
  )
}

export function EmpresasGrid({
  data,
  oportunidades,
}: {
  data: Empresa[]
  oportunidades: Oportunidad[]
}) {
  const searchParams = useSearchParams()
  const initialEmpresa = searchParams.get("empresa") ?? ""
  const initialEstado = searchParams.get("estado") ?? ""
  const [query, setQuery] = useState("")
  const [estado, setEstado] = useState(initialEstado)
  const [sector, setSector] = useState("")
  const [municipioFiltro, setMunicipioFiltro] = useState("")
  const [selected, setSelected] = useState<Empresa | null>(
    () => data.find((e) => e.nombre === initialEmpresa) ?? null,
  )
  const [localData, setLocalData] = useState<Empresa[]>(data)
  const [contactando, setContactando] = useState<string | null>(null)
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [errorContacto, setErrorContacto] = useState("")

  const sectores = useMemo(
    () => [...new Set(localData.map((e) => e.sector))].sort(),
    [localData],
  )
  const municipios = useMemo(
    () => [...new Set(localData.map((e) => e.municipio))].sort(),
    [localData],
  )

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return localData.filter((e) => {
      if (estado && e.estadoComercial !== estado) return false
      if (sector && e.sector !== sector) return false
      if (municipioFiltro && e.municipio !== municipioFiltro) return false
      if (
        q &&
        !`${e.nombre} ${e.municipio} ${e.sector} ${e.perfilBuscado ?? ""}`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [localData, query, estado, sector, municipioFiltro])

  const updateEstado = (id: string, nuevoEstado: EstadoComercial) => {
    setLocalData((prev) =>
      prev.map((e) => (e.id === id ? { ...e, estadoComercial: nuevoEstado } : e)),
    )
    setSelected((prev) =>
      prev?.id === id ? { ...prev, estadoComercial: nuevoEstado } : prev,
    )
  }

  const updateNotas = (id: string, notas: string) => {
    setLocalData((prev) =>
      prev.map((e) => (e.id === id ? { ...e, notas } : e)),
    )
    setSelected((prev) => (prev?.id === id ? { ...prev, notas } : prev))
  }

  const oportunidadesEmpresa = useMemo(() => {
    if (!selected) return []
    return oportunidades.filter((o) => o.empresa === selected.nombre)
  }, [selected, oportunidades])

  const getPuesto = (empresa: Empresa) => {
    return (
      empresa.perfilBuscado ||
      oportunidades.find((o) => o.empresa === empresa.nombre)?.titulo ||
      "personal"
    )
  }

  const contactarEmpresa = async (empresa: Empresa) => {
    if (contactando || enviados.has(empresa.id)) return
    setErrorContacto("")
    setContactando(empresa.id)

    try {
      const response = await fetch("/api/contact-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: empresa.nombre,
          puesto: getPuesto(empresa),
          municipio: empresa.municipio,
          email: empresa.email,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || "No se pudo enviar el email")
      }

      setEnviados((prev) => new Set([...prev, empresa.id]))
      updateEstado(empresa.id, "En seguimiento")
    } catch (error) {
      setErrorContacto(
        error instanceof Error ? error.message : "No se pudo enviar el email",
      )
    } finally {
      setContactando(null)
    }
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
            placeholder="Buscar empresa, perfil o municipio…"
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
        <FilterSelect
          ariaLabel="Filtrar por municipio"
          placeholder="Todos los municipios"
          value={municipioFiltro}
          onChange={setMunicipioFiltro}
          options={municipios.map((m) => ({ value: m, label: m }))}
          className="sm:w-40"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtradas.length} {filtradas.length === 1 ? "empresa" : "empresas"}
          {filtradas.length !== localData.length ? ` de ${localData.length}` : ""}
        </p>
        {errorContacto && (
          <p className="text-xs font-medium text-destructive">{errorContacto}</p>
        )}
      </div>

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
          {filtradas.map((e) => {
            const enviado = enviados.has(e.id)
            const cargando = contactando === e.id
            return (
              <article
                key={e.id}
                onClick={() => setSelected(e)}
                className="flex cursor-pointer flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <PerfilLogo tipoPerfil={e.tipoPerfil} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h3 className="truncate font-medium text-foreground">{e.nombre}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.sector} · {e.municipio}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-foreground/80">
                        Busca: {getPuesto(e)}
                      </p>
                    </div>
                  </div>
                  <EstadoComercialBadge estado={e.estadoComercial} />
                </div>

                <dl className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{e.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">
                      {e.oportunidades} {e.oportunidades === 1 ? "oportunidad" : "oportunidades"}
                    </span>
                  </div>
                </dl>

                <div className="border-t border-border pt-3">
                  <Button
                    type="button"
                    className="w-full"
                    variant={enviado ? "outline" : "default"}
                    disabled={cargando || enviado}
                    onClick={(event) => {
                      event.stopPropagation()
                      void contactarEmpresa(e)
                    }}
                  >
                    {cargando ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Enviando…
                      </>
                    ) : enviado ? (
                      <>
                        <CheckCircle2 className="size-4" />
                        Email enviado
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        CONTACTAR
                      </>
                    )}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.nombre}>
        {selected && (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
              <PerfilLogo tipoPerfil={selected.tipoPerfil} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{getPuesto(selected)}</p>
                <p className="text-xs text-muted-foreground">
                  Perfil detectado · {selected.municipio}
                </p>
              </div>
              <EstadoComercialBadge estado={selected.estadoComercial} />
            </div>

            <Button
              type="button"
              className="w-full"
              variant={enviados.has(selected.id) ? "outline" : "default"}
              disabled={contactando === selected.id || enviados.has(selected.id)}
              onClick={() => void contactarEmpresa(selected)}
            >
              {contactando === selected.id ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando email…
                </>
              ) : enviados.has(selected.id) ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Email enviado correctamente
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  CONTACTAR POR EMAIL
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={Tag} label="Sector" value={selected.sector} />
              <DetailItem icon={MapPin} label="Municipio" value={selected.municipio} />
              <DetailItem icon={MapPin} label="Provincia" value={selected.provincia} />
              <DetailItem
                icon={Target}
                label="Oportunidades"
                value={String(selected.oportunidades)}
              />
              <DetailItem
                icon={Calendar}
                label="Primera detección"
                value={fechaCorta(selected.primeraDeteccion)}
              />
              <DetailItem
                icon={Calendar}
                label="Última actividad"
                value={tiempoRelativo(selected.ultimaActividad)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Contacto
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href={`https://${selected.web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand transition-colors hover:text-brand/80"
                >
                  <Globe className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {selected.web}
                </a>
                <a
                  href={`tel:${selected.telefono.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-brand transition-colors hover:text-brand/80"
                >
                  <Phone className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {selected.telefono}
                </a>
                <span className="flex items-center gap-2 text-foreground">
                  <Mail className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {selected.email}
                </span>
              </div>
            </div>

            {oportunidadesEmpresa.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                  Oportunidades relacionadas
                </p>
                <ul className="flex flex-col gap-1.5">
                  {oportunidadesEmpresa.slice(0, 5).map((o) => (
                    <li key={o.id} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-foreground">{o.titulo}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {tiempoRelativo(o.fechaDeteccion)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Notas comerciales
              </p>
              <textarea
                value={selected.notas}
                onChange={(e) => updateNotas(selected.id, e.target.value)}
                placeholder="Añadir notas comerciales…"
                rows={3}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Cambiar estado
              </p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((est) => (
                  <Button
                    key={est}
                    variant={selected.estadoComercial === est ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateEstado(selected.id, est)}
                  >
                    {est}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
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
