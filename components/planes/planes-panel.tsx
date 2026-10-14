"use client"

import { useState } from "react"
import { Building2, Check, Mail, Minus, PackagePlus, Sparkles } from "lucide-react"

import { CONTACTO_PLANES, PACK_EXTRA, PLAN_ACTUAL, PLANES, type Plan } from "@/lib/planes"
import { cn } from "@/lib/utils"

type Periodo = "mensual" | "anual"

// Siempre con punto de miles (1.000), también en números de 4 cifras.
const numero = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")

function mailtoPlan(plan: Plan, periodo: Periodo) {
  const asunto = `Mejorar el plan del buscador de empresas a ${plan.nombre} (${periodo})`
  const cuerpo = [
    "Hola,",
    "",
    `Queremos mejorar el plan del buscador de empresas al plan ${plan.nombre} (${periodo === "anual" ? `${numero(plan.precioAnual)} €/año` : `${plan.precioMes} €/mes`}, pago ${periodo}).`,
    "",
    "Nombre de la empresa:",
    "Persona de contacto:",
    "Teléfono:",
    "",
    "Gracias.",
  ].join("\n")
  return `mailto:${CONTACTO_PLANES}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

function Precio({ plan, periodo }: { plan: Plan; periodo: Periodo }) {
  if (plan.precioMes === 0) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">0 €</span>
        <span className="text-sm text-muted-foreground">para siempre</span>
      </div>
    )
  }
  if (periodo === "anual") {
    return (
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {numero(Math.round(plan.precioAnual / 12))} €
          </span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {numero(plan.precioAnual)} € al año · 2 meses gratis
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-semibold tracking-tight text-foreground">{plan.precioMes} €</span>
      <span className="text-sm text-muted-foreground">/mes</span>
    </div>
  )
}

function Linea({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-start gap-2 text-sm", ok ? "text-foreground" : "text-muted-foreground/70")}>
      {ok ? (
        <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2} />
      ) : (
        <Minus className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      )}
      <span>{children}</span>
    </li>
  )
}

function BotonPlan({ plan, periodo }: { plan: Plan; periodo: Periodo }) {
  const actual = plan.id === PLAN_ACTUAL
  const indiceActual = PLANES.findIndex((p) => p.id === PLAN_ACTUAL)
  const indice = PLANES.findIndex((p) => p.id === plan.id)
  const base = "flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors"

  if (actual) {
    return <div className={cn(base, "border border-border bg-secondary text-muted-foreground")}>Tu plan actual</div>
  }
  const texto = indice > indiceActual ? `Mejorar a ${plan.nombre}` : `Cambiar a ${plan.nombre}`
  if (!CONTACTO_PLANES) {
    return (
      <div className={cn(base, "border border-dashed border-border text-muted-foreground")}>
        Pago online próximamente
      </div>
    )
  }
  return (
    <a
      href={mailtoPlan(plan, periodo)}
      className={cn(
        base,
        plan.destacado
          ? "bg-brand text-brand-foreground hover:bg-brand/90"
          : "border border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      <Mail className="size-4" />
      {texto}
    </a>
  )
}

const FILAS: { etiqueta: string; valor: (p: Plan) => React.ReactNode }[] = [
  { etiqueta: "Empresas nuevas con email al mes", valor: (p) => `~${numero(p.empresasMes)}` },
  { etiqueta: "Emails que puedes enviar al mes", valor: (p) => numero(p.emailsMes) },
  { etiqueta: "Provincias", valor: (p) => p.provincias },
  { etiqueta: "Búsqueda de ofertas", valor: (p) => p.frecuencia },
  { etiqueta: "Fuentes de ofertas", valor: (p) => p.fuentes },
  { etiqueta: "Perfiles buscados", valor: (p) => p.perfiles },
  { etiqueta: "Usuarios", valor: (p) => p.usuarios },
  { etiqueta: "Botón «Contactar a todas»", valor: (p) => (p.contactarTodas ? "Sí" : "No") },
  { etiqueta: "Contacto por WhatsApp", valor: (p) => (p.whatsapp ? "Sí" : "No") },
  { etiqueta: "Exportar a Excel", valor: (p) => (p.exportar ? "Sí" : "No") },
  { etiqueta: "Soporte", valor: (p) => p.soporte },
]

export function PlanesPanel() {
  const [periodo, setPeriodo] = useState<Periodo>("mensual")
  const actual = PLANES.find((p) => p.id === PLAN_ACTUAL) ?? PLANES[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Tu plan actual: {actual.nombre}</span>
            <span className="text-sm text-muted-foreground">
              Hasta ~{numero(actual.empresasMes)} empresas nuevas con email al mes y {numero(actual.emailsMes)} emails.
            </span>
          </div>
        </div>
        <div className="inline-flex self-start rounded-lg border border-border bg-background p-0.5 sm:self-auto">
          {(["mensual", "anual"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                periodo === p ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "mensual" ? "Mensual" : "Anual · 2 meses gratis"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col gap-5 rounded-xl border bg-card p-5",
              plan.destacado ? "border-brand shadow-sm ring-1 ring-brand/30" : "border-border",
            )}
          >
            {plan.destacado && (
              <span className="absolute -top-2.5 left-5 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-foreground">
                Recomendado
              </span>
            )}
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">{plan.nombre}</h2>
              <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
            </div>

            <Precio plan={plan} periodo={periodo} />

            <div className="flex items-center gap-3 rounded-lg bg-secondary/70 px-4 py-3">
              <Building2 className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                  ~{numero(plan.empresasMes)}
                </span>
                <span className="text-xs text-muted-foreground">empresas nuevas con email al mes</span>
              </div>
            </div>

            <ul className="flex flex-1 flex-col gap-2">
              <Linea ok>{numero(plan.emailsMes)} emails al mes para contactarlas</Linea>
              <Linea ok>{plan.provincias}</Linea>
              <Linea ok>Búsqueda {plan.frecuencia.toLowerCase()}</Linea>
              <Linea ok>{plan.fuentes}</Linea>
              <Linea ok>
                {plan.usuarios} {plan.usuarios === 1 ? "usuario" : "usuarios"}
              </Linea>
              <Linea ok={plan.contactarTodas}>Botón «Contactar a todas»</Linea>
              <Linea ok={plan.whatsapp}>Contacto por WhatsApp</Linea>
              <Linea ok={plan.exportar}>Exportar a Excel</Linea>
            </ul>

            <BotonPlan plan={plan} periodo={periodo} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              ¿Necesitas más? Pack de +{numero(PACK_EXTRA.empresas)} empresas por {PACK_EXTRA.precio} €
            </span>
            <span className="text-sm text-muted-foreground">Disponible para los planes Profesional y Empresa.</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Comparativa</th>
              {PLANES.map((p) => (
                <th key={p.id} className="px-4 py-3 font-semibold text-foreground">
                  {p.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FILAS.map((fila) => (
              <tr key={fila.etiqueta} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">{fila.etiqueta}</td>
                {PLANES.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-foreground">
                    {fila.valor(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Las cantidades de empresas son aproximadas: cuentan empresas nuevas detectadas ese mes con un email verificado
        en su web oficial y dependen de las ofertas que se publiquen en tu zona. Precios sin IVA.
      </p>
    </div>
  )
}
