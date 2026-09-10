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
          <div className="mt-2 px-0.5">
            <img
              src={ENEHIXPRO_LOGO}
              alt="Enehixpro"
              className="block h-auto w-[158px] object-contain"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
