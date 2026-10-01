import { MapaPanel } from "@/components/mapa/mapa-panel"
import { PageHeader } from "@/components/page-header"
import { buildActividadPoints } from "@/lib/geo"
import { getOportunidades } from "@/lib/live-data"
import { filterOportunidadesPeriodo } from "@/lib/presentation"
import type { Periodo } from "@/lib/types"

function normalizePeriodo(value: string | string[] | undefined): Periodo {
  const v = Array.isArray(value) ? value[0] : value
  return v === "hoy" || v === "7d" || v === "30d" ? v : "30d"
}

export default async function MapaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  const periodo = normalizePeriodo(periodoParam)
  const oportunidades = await getOportunidades()
  const oportunidadesPeriodo = filterOportunidadesPeriodo(oportunidades, periodo)
  const points = buildActividadPoints(oportunidadesPeriodo)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <MapaPanel points={points} oportunidades={oportunidadesPeriodo} periodo={periodo} />
    </div>
  )
}
