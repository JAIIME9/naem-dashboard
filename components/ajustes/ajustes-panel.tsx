"use client"

import { useState } from "react"
import {
  Bot,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  MapPin,
  Save,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const FUENTES = [
  { nombre: "Fuentes públicas", estado: "Operativo" as const },
  { nombre: "Portales de empleo", estado: "Operativo" as const },
  { nombre: "Webs corporativas", estado: "Pendiente" as const },
  { nombre: "ATS / páginas de empleo", estado: "Operativo" as const },
]

export function AjustesPanel() {
  const [toast, setToast] = useState<string | null>(null)

  const guardar = () => {
    setToast("Cambios guardados correctamente")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionHeader icon={Building2} titulo="General" />
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <Field label="Nombre de la organización" value="NAEM" />
          <Field label="Nombre del sistema" value="Inteligencia comercial" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeader icon={Bot} titulo="Automatización" />
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Captación automática" value="Activa" badge />
          <Field label="Frecuencia" value="Diaria" />
          <Field label="Última ejecución" value="Hoy, 08:00" icon={Clock} />
          <Field label="Próxima ejecución" value="Mañana, 08:00" icon={Clock} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeader icon={MapPin} titulo="Zonas de búsqueda" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-medium text-foreground">Zona A</span>
            <span className="text-xs text-muted-foreground">Agricultura</span>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="size-3.5" strokeWidth={1.75} />
              Valencia → Almería
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-medium text-foreground">Zona B</span>
            <span className="text-xs text-muted-foreground">Resto de perfiles</span>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="size-3.5" strokeWidth={1.75} />
              Alicante → Vega Baja → Los Alcázares
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeader icon={Database} titulo="Fuentes" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {FUENTES.map((f) => (
              <li key={f.nombre} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-foreground">{f.nombre}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                    f.estado === "Operativo"
                      ? "border-success/15 bg-success/10 text-success"
                      : "border-warning/15 bg-warning/10 text-warning",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      f.estado === "Operativo" ? "bg-success" : "bg-warning",
                    )}
                  />
                  {f.estado}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="default" size="default" onClick={guardar}>
          <Save className="size-4" strokeWidth={1.75} />
          Guardar cambios
        </Button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  titulo,
}: {
  icon: typeof Building2
  titulo: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      <h2 className="text-sm font-medium text-foreground">{titulo}</h2>
    </div>
  )
}

function Field({
  label,
  value,
  badge,
  icon: Icon,
}: {
  label: string
  value: string
  badge?: boolean
  icon?: typeof Clock
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {Icon && <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />}
        {badge ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <span className="size-1.5 rounded-full bg-success" />
            {value}
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  )
}
