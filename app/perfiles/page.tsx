import { PageHeader } from "@/components/page-header"
import { PerfilesPanel } from "@/components/perfiles/perfiles-panel"
import { getEmpresas, getOportunidades, getOtrosPerfiles, getPerfiles } from "@/lib/data"

export default async function PerfilesPage() {
  const [perfiles, otrosPerfiles, oportunidades, empresas] = await Promise.all([
    getPerfiles(),
    getOtrosPerfiles(),
    getOportunidades(),
    getEmpresas(),
  ])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <PerfilesPanel
        perfiles={perfiles}
        otrosPerfiles={otrosPerfiles}
        oportunidades={oportunidades}
        empresas={empresas}
      />
    </div>
  )
}
