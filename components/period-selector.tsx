"use client"

import { useCallback, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Periodo } from "@/lib/types"

const opciones: { value: Periodo; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
]

// Con onChange el cambio es instantáneo: se resuelve en el navegador y solo se
// actualiza la URL, sin pedir la página otra vez al servidor.
export function PeriodSelector({ value, onChange }: { value: Periodo; onChange?: (periodo: Periodo) => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [cargando, startTransition] = useTransition()

  const setPeriodo = useCallback(
    (periodo: Periodo) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("periodo", periodo)
      if (onChange) {
        onChange(periodo)
        window.history.replaceState(null, "", `${pathname}?${params.toString()}`)
        return
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams, onChange],
  )

  return (
    <div
      role="group"
      aria-label="Periodo"
      aria-busy={cargando}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 p-0.5 transition-opacity",
        cargando && "opacity-60",
      )}
    >
      {opciones.map((o) => {
        const activo = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setPeriodo(o.value)}
            aria-pressed={activo}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activo
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
