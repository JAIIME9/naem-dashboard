export type PlanId = "gratis" | "profesional" | "empresa"

export interface Plan {
  id: PlanId
  nombre: string
  precioMes: number
  precioAnual: number
  descripcion: string
  empresasMes: number
  emailsMes: number
  provincias: string
  frecuencia: string
  fuentes: string
  usuarios: number
  perfiles: string
  contactarTodas: boolean
  whatsapp: boolean
  exportar: boolean
  soporte: string
  destacado?: boolean
}

// Plan con el que funciona hoy esta cuenta.
export const PLAN_ACTUAL: PlanId = "gratis"

// Email al que llegan las solicitudes de cambio de plan (hasta que haya pago online).
export const CONTACTO_PLANES = process.env.NEXT_PUBLIC_NAEM_CONTACTO_PLANES || "info@enehix.com"

export const PACK_EXTRA = { empresas: 250, precio: 49 }

export const PLANES: Plan[] = [
  {
    id: "gratis",
    nombre: "Gratis",
    precioMes: 0,
    precioAnual: 0,
    descripcion: "Para probar NAEM en tu zona.",
    empresasMes: 20,
    emailsMes: 50,
    provincias: "1 provincia",
    frecuencia: "1 vez al día",
    fuentes: "1 fuente de ofertas",
    usuarios: 1,
    perfiles: "Los 8 perfiles fijos",
    contactarTodas: false,
    whatsapp: false,
    exportar: false,
    soporte: "Sin soporte",
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precioMes: 79,
    precioAnual: 790,
    descripcion: "Para captar clientes cada semana.",
    empresasMes: 300,
    emailsMes: 1500,
    provincias: "Hasta 3 provincias",
    frecuencia: "Cada 6 horas",
    fuentes: "2 fuentes (Google Jobs + Indeed)",
    usuarios: 2,
    perfiles: "8 perfiles + 5 propios",
    contactarTodas: true,
    whatsapp: true,
    exportar: true,
    soporte: "Soporte por email",
    destacado: true,
  },
  {
    id: "empresa",
    nombre: "Empresa",
    precioMes: 199,
    precioAnual: 1990,
    descripcion: "Para equipos comerciales con mucho volumen.",
    empresasMes: 1000,
    emailsMes: 5000,
    provincias: "Todas las provincias",
    frecuencia: "Cada 3 horas",
    fuentes: "3 fuentes (Google Jobs + Indeed + InfoJobs)",
    usuarios: 5,
    perfiles: "Perfiles ilimitados",
    contactarTodas: true,
    whatsapp: true,
    exportar: true,
    soporte: "Soporte por email y teléfono",
  },
]
