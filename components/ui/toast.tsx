"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2 } from "lucide-react"

export function Toast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
      <CheckCircle2 className="size-4 text-success" strokeWidth={2} />
      <span className="text-sm font-medium text-foreground">{message}</span>
    </div>,
    document.body,
  )
}
