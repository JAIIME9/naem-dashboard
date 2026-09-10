"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bot,
  Building2,
  Check,
  Clock,
  Database,
  Globe,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  UserRoundCheck,
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

type EmailSettings = {
  autoEmail: boolean
  soloNuevas: boolean
  soloEmailVerificado: boolean
}

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  autoEmail: false,
  soloNuevas: true,
  soloEmailVerificado: true,
}

export function AjustesPanel() {
  const [toast, setToast] = useState<string | null>(null)
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS)
  const [emailStatus, setEmailStatus] = useState<"loading" | "ok" | "error">("loading")
  const [savingEmail, setSavingEmail] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      try {
        const res = await fetch("/api/email-automation", { cache: "no-store" })
        if (!res.ok) throw new Error("No disponible")
        const data = await res.json()
        if (cancelled) return
        setEmailSettings({
          autoEmail: Boolean(data.autoEmail),
          soloNuevas: data.soloNuevas !== false,
          soloEmailVerificado: data.soloEmailVerificado !== false,
        })
        setEmailStatus("ok")
      } catch {
        if (cancelled) return
        setEmailStatus("error")
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [])

  const statusText = useMemo(() => {
    if (emailStatus === "loading") return "Conectando con automatización…"
    if (emailStatus === "ok") return "Automatización conectada"
    return "Automatización pendiente de activar en n8n"
  }, [emailStatus])

  async function actualizarEmail(next: EmailSettings) {
    setEmailSettings(next)
    setSavingEmail(true)

    try {
      const res = await fetch("/api/email-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error("No se pudo guardar")
      const data = await res.json()
      setEmailSettings({
        autoEmail: Boolean(data.autoEmail),
        soloNuevas: data.soloNuevas !== false,
        soloEmailVerificado: data.soloEmailVerificado !== false,
      })
      setEmailStatus("ok")
      setToast("Automatización de email actualizada")
    } catch {
      setEmailStatus("error")
      setToast("No se pudo conectar con n8n")
    } finally {
      setSavingEmail(false)
    }
  }

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
        <SectionHeader icon={Mail} titulo="Contacto automático por email" />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Envíos comerciales automáticos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Desde naemadminapp@gmail.com, personalizados para cada empresa y puesto detectado.
              </p>
            </div>
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                emailStatus === "ok"
                  ? "border-success/15 bg-success/10 text-success"
                  : emailStatus === "loading"
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-warning/15 bg-warning/10 text-warning",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  emailStatus === "ok"
                    ? "bg-success"
                    : emailStatus === "loading"
                      ? "bg-muted-foreground"
                      : "bg-warning",
                )}
              />
              {statusText}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ToggleSetting
              icon={Mail}
              title="Contacto automático"
              description="Envía el email en cuanto se detecta una oportunidad nueva."
              checked={emailSettings.autoEmail}
              disabled={savingEmail}
              onChange={(checked) => actualizarEmail({ ...emailSettings, autoEmail: checked })}
            />
            <ToggleSetting
              icon={UserRoundCheck}
              title="Solo empresas nuevas"
              description="Evita volver a contactar por la misma oportunidad detectada."
              checked={emailSettings.soloNuevas}
              disabled={savingEmail}
              onChange={(checked) => actualizarEmail({ ...emailSettings, soloNuevas: checked })}
            />
            <ToggleSetting
              icon={ShieldCheck}
              title="Solo email verificado"
              description="No envía nada si no localiza un correo corporativo fiable."
              checked={emailSettings.soloEmailVerificado}
              disabled={savingEmail}
              onChange={(checked) =>
                actualizarEmail({ ...emailSettings, soloEmailVerificado: checked })
              }
            />
          </div>
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

function ToggleSetting({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: typeof Mail
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-brand bg-brand" : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 flex size-4.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[21px]" : "translate-x-1",
          )}
        >
          {checked && <Check className="size-3 text-brand" strokeWidth={2.25} />}
        </span>
      </button>
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
