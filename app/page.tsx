import { PageHeader } from "@/components/page-header"
import { PlanesPanel } from "@/components/planes/planes-panel"

export default function PlanesPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <PageHeader />
      <PlanesPanel />
    </div>
  )
}
