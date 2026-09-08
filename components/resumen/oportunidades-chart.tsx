"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { fechaCorta, fechaDia } from "@/lib/format"
import type { Periodo, PuntoSerie } from "@/lib/types"

interface TooltipProps {
  active?: boolean
  payload?: { payload: PuntoSerie }[]
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{fechaDia(punto.fecha)}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {punto.valor} oportunidades
      </p>
    </div>
  )
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function OportunidadesChart({
  data,
  periodo,
}: {
  data: PuntoSerie[]
  periodo: Periodo
}) {
  const total = data.reduce((acc, p) => acc + p.valor, 0)
  const isHoy = periodo === "hoy"
  const etiqueta =
    periodo === "hoy"
      ? "Hoy"
      : periodo === "7d"
        ? "Últimos 7 días"
        : "Últimos 30 días"

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium text-foreground">
            Oportunidades detectadas
          </h2>
          <p className="text-xs text-muted-foreground">{etiqueta}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">total del periodo</p>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="fecha"
              tickFormatter={isHoy ? formatHour : fechaCorta}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--brand)", strokeOpacity: 0.25 }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="var(--brand)"
              strokeWidth={2}
              fill="url(#fillBrand)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "var(--brand)",
                stroke: "var(--card)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
