"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { notificaciones } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const router = useRouter()
  const [localNotif, setLocalNotif] = useState(notificaciones)

  const unreadCount = localNotif.filter((n) => !n.leida).length

  const marcarTodasLeidas = () => {
    setLocalNotif((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Notificaciones"
              className="relative flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
            />
          }
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand ring-2 ring-background" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-1.5 py-1">
            <span className="text-sm font-medium text-foreground">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={marcarTodasLeidas}
                className="text-xs font-medium text-brand transition-colors hover:text-brand/80"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-72 overflow-y-auto">
            {localNotif.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-md px-1.5 py-2",
                  !n.leida && "bg-brand-muted/30",
                )}
              >
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    n.leida ? "bg-transparent" : "bg-brand",
                  )}
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm text-foreground">{n.texto}</p>
                  <p className="text-xs text-muted-foreground">{n.tiempo}</p>
                </div>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

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
          <Avatar className="size-8">
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
          <DropdownMenuItem onClick={() => router.push("/ajustes")}>Ajustes</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
