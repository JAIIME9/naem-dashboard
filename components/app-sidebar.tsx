"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { navInferior, navPrincipal, type NavItem } from "@/lib/nav"

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
          <div className="mt-2 inline-flex rounded-md border border-sidebar-border/70 bg-white/70 px-2 py-1.5">
            <Image
              src="/enehixpro-logo.png"
              alt="Enehixpro"
              width={104}
              height={36}
              className="h-auto w-[92px] object-contain opacity-80"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
