"use client"

import { type FormEvent, useEffect, useState } from "react"
import { LockKeyhole } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setConfigError(params.get("config") === "1")
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || data?.ok !== true) {
        setError(data?.error || "No se ha podido iniciar sesión")
        return
      }

      const params = new URLSearchParams(window.location.search)
      const next = params.get("next")
      window.location.href = next && next.startsWith("/") ? next : "/"
    } catch {
      setError("No se ha podido conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-4xl font-black tracking-[-0.08em] text-foreground">NAEM</div>
          <div className="mt-1 text-[11px] font-medium tracking-[0.3em] text-muted-foreground">EMPLEO ETT SL</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-brand">
              <LockKeyhole className="size-5" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Acceso privado</h1>
              <p className="text-xs text-muted-foreground">Introduce la contraseña de administrador.</p>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-xs font-medium text-foreground" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña de acceso"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15"
              autoFocus
              required
            />

            {(error || configError) && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {configError ? "El acceso de administrador todavía no está configurado en producción." : error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Comprobando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">Panel interno · Acceso solo para personal autorizado</p>
      </div>
    </div>
  )
}
