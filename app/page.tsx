import { ResumenPanel, type DatosPeriodo } from "@/components/resumen/resumen-panel"
import {
  getKpis,
  getOportunidades,
  getOportunidadesRecientes,
  getSerieOportunidades,
} from "@/lib/live-data"
import {
  buildProfileDistribution,
  buildProvinceActivity,
  filterOportunidadesPeriodo,
} from "@/lib/presentation"
import type { Periodo } from "@/lib/types"

const PERIODOS: Periodo[] = ["hoy", "7d", "30d"]

function normalizePeriodo(value: string | string[] | undefined): Periodo {
  const v = Array.isArray(value) ? value[0] : value
  return v === "hoy" || v === "7d" || v === "30d" ? v : "30d"
}

async function datosDelPeriodo(periodo: Periodo): Promise<DatosPeriodo> {
  const [kpis, serie, recientes, oportunidades] = await Promise.all([
    getKpis(periodo),
    getSerieOportunidades(periodo),
    getOportunidadesRecientes(6, periodo),
    getOportunidades(),
  ])

  const delPeriodo = filterOportunidadesPeriodo(oportunidades, periodo)
  return {
    kpis,
    serie,
    recientes,
    distribucion: buildProfileDistribution(delPeriodo),
    provincias: buildProvinceActivity(delPeriodo),
  }
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  const periodo = normalizePeriodo(periodoParam)

  // Se calculan los tres periodos de una vez para que el cambio en pantalla sea instantáneo.
  const [hoy, semana, mes] = await Promise.all(PERIODOS.map(datosDelPeriodo))

  return <ResumenPanel datos={{ hoy, "7d": semana, "30d": mes }} periodoInicial={periodo} />
}
