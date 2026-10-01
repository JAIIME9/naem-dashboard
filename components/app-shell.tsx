"use client"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"

  if (isLogin) return <main className="min-h-screen">{children}</main>

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
