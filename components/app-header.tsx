"use client"

import { usePathname } from "next/navigation"
import { Bell, ChevronRight, Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { findNavItem } from "@/lib/nav"

export function AppHeader() {
  const pathname = usePathname()
  const item = findNavItem(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">NAEM</span>
        <ChevronRight className="size-3.5 text-muted-foreground/50" strokeWidth={2} />
        <span className="truncate font-medium text-foreground">
          {item?.titulo ?? "Panel"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Buscar empresas, oportunidades…"
            aria-label="Buscador global"
            className="h-8 w-56 rounded-md border border-border bg-secondary/60 pl-8 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card lg:w-72"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[10px] text-muted-foreground lg:flex">
            ⌘K
          </kbd>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand ring-2 ring-background" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Menú de usuario"
                className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-brand-muted text-[11px] font-semibold text-brand">
                NA
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium">NAEM</span>
              <span className="text-xs font-normal text-muted-foreground">
                equipo@naem.es
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Ajustes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
