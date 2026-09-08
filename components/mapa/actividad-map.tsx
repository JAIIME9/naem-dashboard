"use client"

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet"

import { centroMapa } from "@/lib/geo"
import type { PuntoMapa } from "@/lib/geo"
import "leaflet/dist/leaflet.css"

const BRAND = "#3f5ecb"

export default function ActividadMap({ points }: { points: PuntoMapa[] }) {
  const max = Math.max(...points.map((p) => p.oportunidades), 1)

  return (
    <MapContainer
      center={centroMapa}
      zoom={9}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "var(--secondary)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {points.map((p) => {
        const radius = 8 + (p.oportunidades / max) * 18
        return (
          <CircleMarker
            key={p.municipio}
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{
              color: BRAND,
              weight: 1.5,
              fillColor: BRAND,
              fillOpacity: 0.28,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]}>
              <div className="text-xs">
                <p className="font-semibold text-[13px]">{p.municipio}</p>
                <p>
                  {p.oportunidades}{" "}
                  {p.oportunidades === 1 ? "oportunidad" : "oportunidades"}
                </p>
                <p>
                  {p.empresas} {p.empresas === 1 ? "empresa" : "empresas"}
                </p>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
