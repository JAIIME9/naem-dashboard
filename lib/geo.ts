export interface PuntoMapa {
  municipio: string
  provincia: string
  lat: number
  lng: number
  oportunidades: number
  empresas: number
}

// Coordenadas de los municipios monitorizados (Comunidad Valenciana y Murcia).
export const municipioCoords: Record<string, { lat: number; lng: number }> = {
  Alicante: { lat: 38.3452, lng: -0.481 },
  Elche: { lat: 38.2669, lng: -0.6983 },
  Orihuela: { lat: 38.0849, lng: -0.9445 },
  Benidorm: { lat: 38.5411, lng: -0.1225 },
  Murcia: { lat: 37.9922, lng: -1.1307 },
  Valencia: { lat: 39.4699, lng: -0.3763 },
  Torrevieja: { lat: 37.9787, lng: -0.6822 },
}

// Centro aproximado de la región monitorizada.
export const centroMapa: [number, number] = [38.35, -0.75]
