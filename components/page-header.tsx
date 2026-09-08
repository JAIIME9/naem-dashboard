"use client"

import { usePathname } from "next/navigation"

import { findNavItem } from "@/lib/nav"

export function PageHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const item = findNavItem(pathname)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {item?.titulo ?? "Panel"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
          {item?.subtitulo}
        </p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  )
}
