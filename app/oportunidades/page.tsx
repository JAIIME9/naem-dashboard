import { OportunidadesTable } from "@/components/oportunidades/oportunidades-table"
import { PageHeader } from "@/components/page-header"
import { getOportunidades } from "@/lib/data"

export default async function OportunidadesPage() {
  const oportunidades = await getOportunidades()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <OportunidadesTable data={oportunidades} />
    </div>
  )
}
