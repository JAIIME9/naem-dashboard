import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"

import { EstadoBadge } from "@/components/status-badge"
import { tiempoRelativo } from "@/lib/format"
import type { Oportunidad } from "@/lib/types"

export function OportunidadesRecientes({ data }: { data: Oportunidad[] }) {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium text-foreground">Oportunidades recientes</h2>
          <p className="text-xs text-muted-foreground">
            Últimas ofertas detectadas automáticamente
          </p>
        </div>
        <Link
          href="/oportunidades"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
        >
          Ver todas
          <ArrowRight className="size-3.5" strokeWidth={2} />
        </Link>
      </div>

      <ul className="divide-y divide-border">
        {data.map((o) => (
          <li
            key={o.id}
            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm font-medium text-foreground">{o.titulo}</p>
              <p className="truncate text-xs text-muted-foreground">
                {o.empresa} · {o.municipio}
              </p>
            </div>
            <div className="hidden shrink-0 sm:block">
              <EstadoBadge estado={o.estado} />
            </div>
            <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground md:block">
              {tiempoRelativo(o.fechaDeteccion)}
            </span>
            <a
              href={o.urlOferta}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir oferta: ${o.titulo}`}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.75} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
