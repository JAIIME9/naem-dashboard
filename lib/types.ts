// Dominio de NAEM. Estas entidades reflejan las tablas previstas en Airtable,
// de forma que la capa de datos (lib/data.ts) pueda sustituirse sin tocar la UI.

export type EstadoOportunidad =
  | "Nueva"
  | "Revisada"
  | "Contactada"
  | "Interesante"
  | "Descartada"

export type Prioridad = "Alta" | "Media" | "Baja"

export type EstadoComercial =
  | "Sin contactar"
  | "En seguimiento"
  | "Cliente"
  | "Descartada"

export type TipoPerfil =
  | "Limpieza"
  | "Camareros"
  | "Cocineros"
  | "Administrativos"
  | "Almacén"
  | "Dependientes"
  | "Agricultura"
  | "Construcción"
  | "Otros"

export interface Oportunidad {
  id: string
  titulo: string
  empresa: string
  perfil: string
  tipoPerfil: TipoPerfil
  municipio: string
  provincia: string
  zona: string
  urlOferta: string
  fuente: string
  fechaPublicacion: string // ISO
  fechaDeteccion: string // ISO
  estado: EstadoOportunidad
  prioridad: Prioridad
}

export interface Empresa {
  id: string
  nombre: string
  web: string
  telefono: string
  email: string
  municipio: string
  provincia: string
  sector: string
  oportunidades: number
  estadoComercial: EstadoComercial
  ultimaActividad: string // ISO
}

export interface Perfil {
  id: string
  nombre: TipoPerfil
  activo: boolean
}

export interface Municipio {
  id: string
  municipio: string
  provincia: string
  zona: string
  activo: boolean
}

export type Periodo = "hoy" | "7d" | "30d"

export interface Kpi {
  id: string
  etiqueta: string
  valor: number
  delta?: number
  deltaEtiqueta?: string
}

export interface PuntoSerie {
  fecha: string // ISO
  valor: number
}

export interface DistribucionPerfil {
  tipoPerfil: TipoPerfil
  valor: number
}

export interface ZonaActividad {
  zona: string
  valor: number
}
