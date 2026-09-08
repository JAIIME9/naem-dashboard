import { MapaPanel } from "@/components/mapa/mapa-panel"
import { PageHeader } from "@/components/page-header"
import { getActividadGeografica } from "@/lib/data"

export default async function MapaPage() {
  const points = await getActividadGeografica()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <MapaPanel points={points} />
    </div>
  )
}
