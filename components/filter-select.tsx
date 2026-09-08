"use client"

import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  className?: string
  ariaLabel: string
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 w-full cursor-pointer appearance-none rounded-lg border border-input bg-card py-1 pl-2.5 pr-8 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          value === "" && "text-muted-foreground",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
    </div>
  )
}
