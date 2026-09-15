import { PageHeader } from "@/components/page-header"
import { PeriodSelector } from "@/components/period-selector"
import { KpiCard } from "@/components/resumen/kpi-card"
import { OportunidadesChart } from "@/components/resumen/oportunidades-chart"
import { OportunidadesRecientes } from "@/components/resumen/oportunidades-recientes"
import { PerfilesDonut } from "@/components/resumen/perfiles-donut"
import { ZonasWidget } from "@/components/resumen/zonas-widget"
import {
  getDistribucionPerfiles,
  getKpis,
  getOportunidadesRecientes,
  getSerieOportunidades,
  getZonasActividad,
} from "@/lib/live-data"
import type { Periodo } from "@/lib/types"

function normalizePeriodo(value: string | string[] | undefined): Periodo {
  const v = Array.isArray(value) ? value[0] : value
  return v === "hoy" || v === "7d" || v === "30d" ? v : "30d"
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  const periodo = normalizePeriodo(periodoParam)

  const [kpis, serie, distribucion, zonas, recientes] = await Promise.all([
    getKpis(periodo),
    getSerieOportunidades(periodo),
    getDistribucionPerfiles(periodo),
    getZonasActividad(periodo),
    getOportunidadesRecientes(6, periodo),
  ])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader>
        <PeriodSelector value={periodo} />
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
        <ZonasWidget data={zonas} />
      </div>
    </div>
  )
}
