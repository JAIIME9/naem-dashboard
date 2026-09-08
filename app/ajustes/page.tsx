import { AjustesPanel } from "@/components/ajustes/ajustes-panel"
import { PageHeader } from "@/components/page-header"

export default function AjustesPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <AjustesPanel />
    </div>
  )
}
