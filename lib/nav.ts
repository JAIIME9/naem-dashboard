import {
  Building2,
  LayoutGrid,
  Map,
  Settings,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  titulo: string
  subtitulo: string
}

export const navPrincipal: NavItem[] = [
  {
    href: "/",
    label: "Resumen",
    icon: LayoutGrid,
    titulo: "Resumen",
    subtitulo:
      "Visión general de la actividad comercial y nuevas oportunidades detectadas.",
  },
  {
    href: "/oportunidades",
    label: "Oportunidades",
    icon: Target,
    titulo: "Oportunidades",
    subtitulo: "Ofertas de empleo detectadas automáticamente en tu zona.",
  },
  {
    href: "/empresas",
    label: "Empresas",
    icon: Building2,
    titulo: "Empresas",
    subtitulo: "Empresas que están contratando y su estado comercial.",
  },
  {
    href: "/mapa",
    label: "Mapa",
    icon: Map,
    titulo: "Mapa",
    subtitulo: "Distribución geográfica de la actividad de contratación.",
  },
  {
    href: "/perfiles",
    label: "Perfiles",
    icon: Users,
    titulo: "Perfiles",
    subtitulo: "Perfiles profesionales monitorizados por el sistema.",
  },
]

export const navInferior: NavItem[] = [
  {
    href: "/ajustes",
    label: "Ajustes",
    icon: Settings,
    titulo: "Ajustes",
    subtitulo: "Configuración de la cuenta, zonas y fuentes de datos.",
  },
]

export const marcaIcon = Sparkles

export function findNavItem(pathname: string): NavItem | undefined {
  const all = [...navPrincipal, ...navInferior]
  if (pathname === "/") return all[0]
  return all.find((i) => i.href !== "/" && pathname.startsWith(i.href))
}
