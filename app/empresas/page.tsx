import { EmpresasGrid } from "@/components/empresas/empresas-grid"
import { PageHeader } from "@/components/page-header"
import { getEmpresas } from "@/lib/data"

export default async function EmpresasPage() {
  const empresas = await getEmpresas()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <EmpresasGrid data={empresas} />
    </div>
  )
}
