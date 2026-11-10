"use client"

import { useState } from "react"

import { PageHeader } from "@/components/page-header"
import { PeriodSelector } from "@/components/period-selector"
import { KpiCard } from "@/components/resumen/kpi-card"
import { OportunidadesChart } from "@/components/resumen/oportunidades-chart"
import { OportunidadesRecientes } from "@/components/resumen/oportunidades-recientes"
import { PerfilesDonut } from "@/components/resumen/perfiles-donut"
import { ZonasWidget } from "@/components/resumen/zonas-widget"
import type { DistribucionPerfil, Kpi, Oportunidad, Periodo, PuntoSerie, ZonaActividad } from "@/lib/types"

export type DatosPeriodo = {
  kpis: Kpi[]
  serie: PuntoSerie[]
  recientes: Oportunidad[]
  distribucion: DistribucionPerfil[]
  provincias: ZonaActividad[]
}

// Los tres periodos llegan ya calculados, así que cambiar de Hoy / 7 días / 30 días es instantáneo.
export function ResumenPanel({
  datos,
  periodoInicial,
}: {
  datos: Record<Periodo, DatosPeriodo>
  periodoInicial: Periodo
}) {
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial)
  const { kpis, serie, recientes, distribucion, provincias } = datos[periodo]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader>
        <PeriodSelector value={periodo} onChange={setPeriodo} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OportunidadesChart data={serie} periodo={periodo} />
        </div>
        <PerfilesDonut data={distribucion} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OportunidadesRecientes data={recientes} />
        </div>
        <ZonasWidget data={provincias} />
      </div>
    </div>
  )
}
