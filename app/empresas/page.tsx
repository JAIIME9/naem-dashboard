import { Suspense } from "react"
import { EmpresasGrid } from "@/components/empresas/empresas-grid"
import { PageHeader } from "@/components/page-header"
import { getEmpresas, getOportunidades } from "@/lib/data"

export default async function EmpresasPage() {
  const [empresas, oportunidades] = await Promise.all([
    getEmpresas(),
    getOportunidades(),
  ])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <Suspense>
        <EmpresasGrid data={empresas} oportunidades={oportunidades} />
      </Suspense>
    </div>
  )
}
