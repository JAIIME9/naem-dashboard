"use client"

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet"
import Link from "next/link"

import { centroMapa } from "@/lib/geo"
import type { PuntoMapa } from "@/lib/geo"
import type { Oportunidad } from "@/lib/types"
import "leaflet/dist/leaflet.css"

const BRAND = "#3f5ecb"

export default function ActividadMap({ points, oportunidades }: { points: PuntoMapa[]; oportunidades: Oportunidad[] }) {
  const max = Math.max(...points.map((p) => p.oportunidades), 1)

  return (
    <MapContainer center={centroMapa} zoom={8} scrollWheelZoom={false} className="h-full w-full" style={{ background: "var(--secondary)" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {points.map((p) => {
        const radius = 8 + (p.oportunidades / max) * 18
        const perfiles = oportunidades
          .filter((o) => o.municipio === p.municipio)
          .reduce<Record<string, number>>((acc, o) => {
            acc[o.tipoPerfil] = (acc[o.tipoPerfil] || 0) + 1
            return acc
          }, {})
        const top = Object.entries(perfiles).sort((a,b) => b[1]-a[1]).slice(0,3).map(([n]) => n)
        return (
          <CircleMarker key={p.municipio} center={[p.lat, p.lng]} radius={radius} pathOptions={{ color: BRAND, weight: 1.5, fillColor: BRAND, fillOpacity: 0.28 }}>
            <Popup>
              <div className="min-w-40 text-xs">
                <p className="mb-1 text-[13px] font-semibold">{p.municipio}</p>
                <p>{p.oportunidades} {p.oportunidades === 1 ? "oportunidad" : "oportunidades"} · {p.empresas} {p.empresas === 1 ? "empresa" : "empresas"}</p>
                {top.length > 0 && <p className="mt-1 text-gray-500">{top.join(" · ")}</p>}
                <Link href={`/oportunidades?municipio=${encodeURIComponent(p.municipio)}`} className="mt-2 inline-block font-medium text-blue-600">Ver oportunidades →</Link>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
