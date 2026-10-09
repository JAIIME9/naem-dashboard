import { cn } from "@/lib/utils"
import {
  estadoComercialStyle,
  estadoOportunidadStyle,
} from "@/lib/ui"
import type { EstadoComercial, EstadoOportunidad } from "@/lib/types"

function BaseBadge({
  label,
  dot,
  className,
}: {
  label: string
  dot: string
  className: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      {label}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: EstadoOportunidad }) {
  const s = estadoOportunidadStyle[estado]
  return <BaseBadge label={s.label} dot={s.dot} className={s.className} />
}

export function EstadoComercialBadge({ estado }: { estado: EstadoComercial }) {
  const s = estadoComercialStyle[estado]
  return <BaseBadge label={estado} dot={s.dot} className={s.className} />
}
