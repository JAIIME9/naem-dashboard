"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Search,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { findNavItem } from "@/lib/nav"
import { oportunidades, empresas, notificaciones } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const item = findNavItem(pathname)
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [localNotif, setLocalNotif] = useState(notificaciones)

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { oportunidades: [], empresas: [] }
    return {
      oportunidades: oportunidades
        .filter((o) => `${o.titulo} ${o.empresa} ${o.municipio}`.toLowerCase().includes(q))
        .slice(0, 5),
      empresas: empresas
        .filter((e) => `${e.nombre} ${e.municipio} ${e.sector}`.toLowerCase().includes(q))
        .slice(0, 5),
    }
  }, [query])

  const hasResults = resultados.oportunidades.length > 0 || resultados.empresas.length > 0
  const unreadCount = localNotif.filter((n) => !n.leida).length

  const marcarTodasLeidas = () => {
    setLocalNotif((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  const navigateToOportunidad = (id: string) => {
    setShowResults(false)
    setQuery("")
    router.push(`/oportunidades`)
  }

  const navigateToEmpresa = (nombre: string) => {
    setShowResults(false)
    setQuery("")
    router.push(`/empresas`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">NAEM</span>
        <ChevronRight className="size-3.5 text-muted-foreground/50" strokeWidth={2} />
        <span className="truncate font-medium text-foreground">
          {item?.titulo ?? "Panel"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Buscar empresas, oportunidades…"
            aria-label="Buscador global"
            className="h-8 w-56 rounded-md border border-border bg-secondary/60 pl-8 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card lg:w-72"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={1.75} />
            </button>
          )}

          {showResults && query && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
              {!hasResults ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Sin resultados para &ldquo;{query}&rdquo;
                </p>
              ) : (
                <>
                  {resultados.oportunidades.length > 0 && (
                    <>
                      <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Oportunidades
                      </p>
                      {resultados.oportunidades.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onMouseDown={() => navigateToOportunidad(o.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                        >
                          <Briefcase className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">{o.titulo}</p>
                            <p className="truncate text-xs text-muted-foreground">{o.empresa} · {o.municipio}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {resultados.empresas.length > 0 && (
                    <>
                      <p className="mt-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Empresas
                      </p>
                      {resultados.empresas.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onMouseDown={() => navigateToEmpresa(e.nombre)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                        >
                          <Building2 className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">{e.nombre}</p>
                            <p className="truncate text-xs text-muted-foreground">{e.sector} · {e.municipio}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Notificaciones"
                className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              />
            }
          >
            <Bell className="size-4" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand ring-2 ring-background" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-1.5 py-1">
              <span className="text-sm font-medium text-foreground">Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  className="text-xs font-medium text-brand transition-colors hover:text-brand/80"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto">
              {localNotif.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-md px-1.5 py-2",
                    !n.leida && "bg-brand-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 size-2 shrink-0 rounded-full",
                      n.leida ? "bg-transparent" : "bg-brand",
                    )}
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-sm text-foreground">{n.texto}</p>
                    <p className="text-xs text-muted-foreground">{n.tiempo}</p>
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Menú de usuario"
                className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-brand-muted text-[11px] font-semibold text-brand">
                NA
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium">NAEM</span>
              <span className="text-xs font-normal text-muted-foreground">
                equipo@naem.es
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Ajustes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
