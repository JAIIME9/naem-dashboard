import type {
  EstadoComercial,
  EstadoOportunidad,
  Prioridad,
  TipoPerfil,
} from "./types"

// Estilos de badge por estado de oportunidad (puntos + fondo muy sutil).
export const estadoOportunidadStyle: Record<
  EstadoOportunidad,
  { label: string; dot: string; className: string }
> = {
  Nueva: {
    label: "Nueva",
    dot: "bg-brand",
    className: "bg-brand-muted text-brand border-brand/15",
  },
  Revisada: {
    label: "Revisada",
    dot: "bg-muted-foreground/60",
    className: "bg-secondary text-muted-foreground border-border",
  },
  Contactada: {
    label: "Contactada",
    dot: "bg-success",
    className: "bg-success/10 text-success border-success/15",
  },
  Interesante: {
    label: "Interesante",
    dot: "bg-warning",
    className: "bg-warning/10 text-warning border-warning/15",
  },
  Descartada: {
    label: "Descartada",
    dot: "bg-muted-foreground/40",
    className: "bg-muted text-muted-foreground/70 border-border",
  },
}

export const estadoComercialStyle: Record<
  EstadoComercial,
  { dot: string; className: string }
> = {
  "Sin contactar": {
    dot: "bg-muted-foreground/50",
    className: "bg-secondary text-muted-foreground border-border",
  },
  "En seguimiento": {
    dot: "bg-warning",
    className: "bg-warning/10 text-warning border-warning/15",
  },
  Cliente: {
    dot: "bg-success",
    className: "bg-success/10 text-success border-success/15",
  },
  Descartada: {
    dot: "bg-muted-foreground/40",
    className: "bg-muted text-muted-foreground/70 border-border",
  },
}

export const prioridadStyle: Record<Prioridad, string> = {
  Alta: "text-destructive",
  Media: "text-warning",
  Baja: "text-muted-foreground",
}

// Color asignado a cada perfil (tokens de gráfico). Legenda y donut coinciden.
export const perfilColor: Record<TipoPerfil, string> = {
  Camareros: "var(--chart-1)",
  Agricultura: "var(--chart-2)",
  Cocineros: "var(--chart-3)",
  Almacén: "var(--chart-4)",
  Limpieza: "var(--chart-5)",
  Construcción: "var(--chart-6)",
  Administrativos: "var(--chart-7)",
  Dependientes: "var(--chart-8)",
  Otros: "var(--chart-9)",
}
