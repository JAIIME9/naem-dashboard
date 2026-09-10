"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { navInferior, navPrincipal, type NavItem } from "@/lib/nav"

const ENEHIXPRO_LOGO =
  "data:image/png;base64,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"

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-brand" : "text-muted-foreground/80 group-hover:text-foreground",
        )}
        strokeWidth={1.75}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-[88px] items-center border-b border-sidebar-border px-5">
        <div className="flex flex-col leading-none">
          <span className="text-[28px] font-semibold tracking-[-0.055em] text-foreground">
            NAEM
          </span>
          <span className="mt-2 text-[10px] font-light tracking-[0.18em] text-muted-foreground">
            EMPLEO ETT SL
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Panel
        </p>
        {navPrincipal.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        {navInferior.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <div className="mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-[11px] font-semibold text-brand">
            NA
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-foreground">NAEM</span>
            <span className="truncate text-[11px] text-muted-foreground">
              Equipo comercial
            </span>
          </div>
        </div>

        <div className="mt-2 border-t border-sidebar-border/70 px-2.5 pt-3">
          <span className="block text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
            Desarrollado por
          </span>
          <div className="mt-2 flex h-[46px] w-[150px] items-center justify-start overflow-hidden rounded-md bg-[#f8f4e9] px-1.5">
            <img
              src={ENEHIXPRO_LOGO}
              alt="Enehixpro"
              className="block h-auto w-full object-contain"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
