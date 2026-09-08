"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import { perfilColor } from "@/lib/ui"
import type { DistribucionPerfil } from "@/lib/types"

export function PerfilesDonut({ data }: { data: DistribucionPerfil[] }) {
  const total = data.reduce((acc, d) => acc + d.valor, 0)

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">Perfiles más demandados</h2>
        <p className="text-xs text-muted-foreground">Distribución de oportunidades</p>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="valor"
                nameKey="tipoPerfil"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={66}
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {data.map((d) => (
                  <Cell key={d.tipoPerfil} fill={perfilColor[d.tipoPerfil]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {total}
            </span>
            <span className="text-[11px] text-muted-foreground">total</span>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
          {data.slice(0, 6).map((d) => (
            <li key={d.tipoPerfil} className="flex items-center gap-2 text-sm">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: perfilColor[d.tipoPerfil] }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {d.tipoPerfil}
              </span>
              <span className="tabular-nums font-medium text-foreground">
                {Math.round((d.valor / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
