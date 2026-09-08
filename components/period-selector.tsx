"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Periodo } from "@/lib/types"

const opciones: { value: Periodo; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
]

export function PeriodSelector({ value }: { value: Periodo }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setPeriodo = useCallback(
    (periodo: Periodo) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("periodo", periodo)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return (
    <div
      role="group"
      aria-label="Periodo"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 p-0.5"
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
