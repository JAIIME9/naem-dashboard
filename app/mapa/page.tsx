import { MapaPanel } from "@/components/mapa/mapa-panel"
import { PageHeader } from "@/components/page-header"
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
  // Se mandan los últimos 30 días y el panel filtra Hoy / 7 días en el navegador, al instante.
  const oportunidades30 = filterOportunidadesPeriodo(oportunidades, "30d")

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <MapaPanel oportunidades30={oportunidades30} periodoInicial={periodo} />
    </div>
  )
}
