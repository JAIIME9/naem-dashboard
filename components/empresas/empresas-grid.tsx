"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  BellRing,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  Globe,
  HardHat,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareReply,
  Phone,
  RefreshCw,
  Search,
  SearchX,
  Send,
  SendHorizontal,
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
import { MUNICIPIOS_POR_PROVINCIA, PROVINCIAS_NAEM } from "@/lib/municipios"
import { formatoTelefono, mensajeWhatsapp, urlWhatsapp } from "@/lib/presentation"
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

type RespuestaCliente = {
  from: string
  subject: string
  date: string
  body: string
  uid: string
}

function PerfilLogo({ tipoPerfil = "Otros" }: { tipoPerfil?: TipoPerfil }) {
  const Icon = ICONOS[tipoPerfil] ?? Briefcase
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/70 text-brand shadow-sm">
      <Icon className="size-5" strokeWidth={1.8} />
    </div>
  )
}

function externalUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : ""
  } catch {
    return ""
  }
}

function fechaRespuesta(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
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
  const [provincia, setProvincia] = useState("")
  const [municipioFiltro, setMunicipioFiltro] = useState("")
  const [selected, setSelected] = useState<Empresa | null>(
    () => data.find((e) => e.nombre === initialEmpresa) ?? null,
  )
  const [localData, setLocalData] = useState<Empresa[]>(data)
  const [contactando, setContactando] = useState<string | null>(null)
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [simulados, setSimulados] = useState<Set<string>>(new Set())
  const [errorContacto, setErrorContacto] = useState("")
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaCliente>>({})
  const [comprobandoRespuestas, setComprobandoRespuestas] = useState(false)
  const [errorRespuestas, setErrorRespuestas] = useState("")

  // Con una provincia elegida se listan todos sus municipios; sin provincia, solo los que tienen empresas.
  const municipios = useMemo(() => {
    const base = provincia ? localData.filter((e) => e.provincia === provincia) : localData
    const nombres = new Set(base.map((e) => e.municipio).filter(Boolean))
    if (provincia) for (const m of MUNICIPIOS_POR_PROVINCIA[provincia] ?? []) nombres.add(m)
    return [...nombres].sort((a, b) => a.localeCompare(b, "es"))
  }, [localData, provincia])

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return localData.filter((e) => {
      if (estado && e.estadoComercial !== estado) return false
      if (provincia && e.provincia !== provincia) return false
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
  }, [localData, query, estado, provincia, municipioFiltro])

  const empresasComprobables = useMemo(
    () =>
      localData
        .filter((e) => !e.email.toLowerCase().endsWith("@example.invalid"))
        .map((e) => ({ id: e.id, email: e.email })),
    [localData],
  )

  const comprobarRespuestas = useCallback(async (silencioso = false) => {
    if (empresasComprobables.length === 0) return
    if (!silencioso) setComprobandoRespuestas(true)
    setErrorRespuestas("")

    try {
      const response = await fetch("/api/company-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ companies: empresasComprobables }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || "No se pudieron comprobar las respuestas")
      }
      setRespuestas(result?.replies ?? {})
    } catch (error) {
      setErrorRespuestas(
        error instanceof Error ? error.message : "No se pudieron comprobar las respuestas",
      )
    } finally {
      if (!silencioso) setComprobandoRespuestas(false)
    }
  }, [empresasComprobables])

  useEffect(() => {
    void comprobarRespuestas(true)
    const interval = window.setInterval(() => {
      void comprobarRespuestas(true)
    }, 60_000)
    return () => window.clearInterval(interval)
  }, [comprobarRespuestas])

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

  // Envía el email a una empresa. Devuelve true si se envió.
  const enviarEmail = async (empresa: Empresa): Promise<boolean> => {
    try {
      const response = await fetch("/api/contact-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: empresa.nombre,
          puesto: getPuesto(empresa),
          municipio: empresa.municipio,
          email: empresa.email,
          provincia: empresa.provincia,
          opportunity_key: empresa.opportunityKey,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || "No se pudo enviar el email")
      }

      setEnviados((prev) => new Set([...prev, empresa.id]))
      if (result?.simulated) {
        setSimulados((prev) => new Set([...prev, empresa.id]))
      }
      updateEstado(empresa.id, "En seguimiento")
      return true
    } catch (error) {
      setErrorContacto(
        `${empresa.nombre}: ${error instanceof Error ? error.message : "No se pudo enviar el email"}`,
      )
      return false
    }
  }

  const contactarEmpresa = async (empresa: Empresa) => {
    if (contactando || masivo?.activo || enviados.has(empresa.id)) return
    setErrorContacto("")
    setContactando(empresa.id)
    try {
      await enviarEmail(empresa)
    } finally {
      setContactando(null)
    }
  }

  // Envío a todas las empresas pendientes, una detrás de otra.
  const [masivo, setMasivo] = useState<{ activo: boolean; total: number; hechos: number; ok: number; fallos: number } | null>(null)
  const detenerMasivo = useRef(false)

  const pendientes = useMemo(
    () => localData.filter((e) => e.estadoComercial === "Sin contactar" && !enviados.has(e.id) && e.email),
    [localData, enviados],
  )

  const contactarTodas = async () => {
    if (contactando || masivo?.activo || pendientes.length === 0) return
    const lista = [...pendientes]
    const ok = window.confirm(
      `Se enviará el email de contacto a ${lista.length} ${lista.length === 1 ? "empresa pendiente" : "empresas pendientes"}. ¿Continuar?`,
    )
    if (!ok) return

    detenerMasivo.current = false
    setErrorContacto("")
    let enviadosOk = 0
    let fallos = 0
    setMasivo({ activo: true, total: lista.length, hechos: 0, ok: 0, fallos: 0 })

    for (let i = 0; i < lista.length; i++) {
      if (detenerMasivo.current) break
      setContactando(lista[i].id)
      const enviado = await enviarEmail(lista[i])
      if (enviado) enviadosOk++
      else fallos++
      setMasivo({ activo: true, total: lista.length, hechos: i + 1, ok: enviadosOk, fallos })
      // Pausa entre envíos para no saturar el servidor de correo.
      if (i < lista.length - 1 && !detenerMasivo.current) await new Promise((r) => setTimeout(r, 2000))
    }

    setContactando(null)
    setMasivo((prev) => (prev ? { ...prev, activo: false } : prev))
  }

  const abrirWhatsapp = (empresa: Empresa) => {
    if (!empresa.telefono) return
    const url = urlWhatsapp(empresa.telefono, mensajeWhatsapp(empresa.nombre, getPuesto(empresa)))
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const respuestaIds = Object.keys(respuestas)
  const primeraEmpresaConRespuesta = respuestaIds.length
    ? localData.find((e) => e.id === respuestaIds[0]) ?? null
    : null

  return (
    <div className="flex flex-col gap-4">
      {respuestaIds.length > 0 && (
        <button
          type="button"
          onClick={() => primeraEmpresaConRespuesta && setSelected(primeraEmpresaConRespuesta)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100/70"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <BellRing className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-emerald-950">
                {respuestaIds.length === 1
                  ? "Tienes una respuesta de un cliente"
                  : `Tienes ${respuestaIds.length} respuestas de clientes`}
              </span>
              <span className="block truncate text-xs text-emerald-800/80">
                Puedes leerla directamente desde la ficha de la empresa.
              </span>
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-emerald-800">Ver respuesta</span>
        </button>
      )}

      {(pendientes.length > 0 || masivo) && (
        <div className="flex flex-col gap-3 rounded-xl border border-brand/25 bg-brand-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {masivo?.activo ? (
              <>
                <p className="text-sm font-semibold text-foreground">
                  Enviando emails… {masivo.hechos} de {masivo.total}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary sm:w-72">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${Math.round((masivo.hechos / Math.max(1, masivo.total)) * 100)}%` }}
                  />
                </div>
              </>
            ) : masivo ? (
              <p className="text-sm font-semibold text-foreground">
                Envío terminado: {masivo.ok} {masivo.ok === 1 ? "email enviado" : "emails enviados"}
                {masivo.fallos > 0 ? ` · ${masivo.fallos} sin enviar` : ""}
                {pendientes.length > 0 ? ` · quedan ${pendientes.length} pendientes` : ""}
              </p>
            ) : (
              <p className="text-sm font-semibold text-foreground">
                Tienes {pendientes.length} {pendientes.length === 1 ? "empresa pendiente" : "empresas pendientes"} de contactar
              </p>
            )}
          </div>
          {masivo?.activo ? (
            <Button type="button" variant="outline" size="sm" onClick={() => { detenerMasivo.current = true }}>
              Detener
            </Button>
          ) : pendientes.length > 0 ? (
            <Button type="button" disabled={!!contactando} onClick={() => void contactarTodas()}>
              <SendHorizontal className="size-4" />
              CONTACTAR A TODAS ({pendientes.length})
            </Button>
          ) : null}
        </div>
      )}

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
          ariaLabel="Filtrar por provincia"
          placeholder="Todas las provincias"
          value={provincia}
          onChange={(value) => {
            setProvincia(value)
            setMunicipioFiltro("")
          }}
          options={PROVINCIAS_NAEM.map((p) => ({ value: p, label: p }))}
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
        <div className="flex items-center gap-3">
          {errorContacto && (
            <p className="text-xs font-medium text-destructive">{errorContacto}</p>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={comprobandoRespuestas}
            onClick={() => void comprobarRespuestas(false)}
          >
            <RefreshCw className={`size-3.5 ${comprobandoRespuestas ? "animate-spin" : ""}`} />
            Revisar respuestas
          </Button>
        </div>
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
            const simulado = simulados.has(e.id)
            const cargando = contactando === e.id
            const respuesta = respuestas[e.id]
            return (
              <article
                key={e.id}
                onClick={() => setSelected(e)}
                className={`flex cursor-pointer flex-col gap-4 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  respuesta
                    ? "border-emerald-300 ring-1 ring-emerald-100"
                    : "border-border hover:border-brand/25"
                }`}
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

                {respuesta && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                    <MessageSquareReply className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      Cliente respondió: {respuesta.subject}
                    </span>
                  </div>
                )}

                <dl className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{e.email}</span>
                  </div>
                  {e.telefono && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{formatoTelefono(e.telefono)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">
                      {e.oportunidades} {e.oportunidades === 1 ? "oportunidad" : "oportunidades"}
                    </span>
                  </div>
                </dl>

                <div className={`grid gap-2 border-t border-border pt-3 ${e.telefono ? "grid-cols-2" : "grid-cols-1"}`}>
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
                        {simulado ? "Email demo simulado" : "Email enviado"}
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        CONTACTAR
                      </>
                    )}
                  </Button>
                  {e.telefono && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={(event) => {
                        event.stopPropagation()
                        abrirWhatsapp(e)
                      }}
                    >
                      <MessageCircle className="size-4" />
                      WHATSAPP
                    </Button>
                  )}
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
                  {simulados.has(selected.id)
                    ? "Email de demostración simulado"
                    : "Email enviado correctamente"}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  CONTACTAR POR EMAIL
                </>
              )}
            </Button>

            {selected.telefono && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => abrirWhatsapp(selected)}
              >
                <MessageCircle className="size-4" />
                CONTACTAR POR WHATSAPP
              </Button>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Inbox className="size-4 text-brand" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Respuesta del cliente
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={comprobandoRespuestas}
                  onClick={() => void comprobarRespuestas(false)}
                >
                  <RefreshCw className={`size-3.5 ${comprobandoRespuestas ? "animate-spin" : ""}`} />
                  Comprobar
                </Button>
              </div>

              {respuestas[selected.id] ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-emerald-800">
                      <MessageSquareReply className="size-4" />
                      <span className="text-sm font-semibold">El cliente ha respondido</span>
                    </div>
                    <p className="text-xs text-emerald-900/70">
                      {respuestas[selected.id].from} · {fechaRespuesta(respuestas[selected.id].date)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Asunto</p>
                    <p className="text-sm font-medium text-foreground">
                      {respuestas[selected.id].subject}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Mensaje</p>
                    <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm leading-6 text-foreground">
                      {respuestas[selected.id].body}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-secondary/35 px-3 py-4 text-center">
                  <p className="text-sm font-medium text-foreground">Sin respuesta todavía</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    La bandeja se comprueba automáticamente cada minuto.
                  </p>
                  {errorRespuestas && (
                    <p className="mt-2 text-xs font-medium text-destructive">{errorRespuestas}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={Tag} label="Perfil" value={selected.sector} />
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
                {externalUrl(selected.web) && (
                  <a href={externalUrl(selected.web)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand transition-colors hover:text-brand/80">
                    <Globe className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {selected.web}
                  </a>
                )}
                {selected.telefono && (
                  <button type="button" onClick={() => abrirWhatsapp(selected)}
                    className="flex items-center gap-2 text-left text-emerald-700 transition-colors hover:text-emerald-800">
                    <MessageCircle className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {formatoTelefono(selected.telefono)} (WhatsApp)
                  </button>
                )}
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
                  {oportunidadesEmpresa.map((o) => (
                    <li key={o.id} className="flex items-center gap-2 text-sm">
                      {externalUrl(o.urlOferta) ? (
                        <a href={externalUrl(o.urlOferta)} target="_blank" rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate text-brand hover:underline">{o.titulo}</a>
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-foreground">{o.titulo}</span>
                      )}
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
