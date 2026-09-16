import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const iconoArrastrable = L.divIcon({
  className: 'marcador-parque',
  html: '<div class="marcador-pin" style="background:#F2B705"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
})

function CapturarClics({ onCambio }: { onCambio: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onCambio(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)))
    },
  })
  return null
}

/** Mueve la vista cuando el usuario pega coordenadas en los campos de texto. */
function SeguirCoordenadas({ lat, lng }: { lat: number; lng: number }) {
  const mapa = useMap()
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) mapa.setView([lat, lng], mapa.getZoom())
  }, [lat, lng, mapa])
  return null
}

interface Props {
  lat: number
  lng: number
  onCambio: (lat: number, lng: number) => void
}

/** Mini mapa: da clic o arrastra el marcador para fijar la ubicación. */
export function SelectorUbicacion({ lat, lng, onCambio }: Props) {
  const valida = Number.isFinite(lat) && Number.isFinite(lng)
  const centro: [number, number] = valida ? [lat, lng] : [23.6, -102.5]

  return (
    <div className="overflow-hidden rounded-lg border border-acero-200 dark:border-acero-700">
      <MapContainer center={centro} zoom={valida ? 11 : 5} className="h-56 w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CapturarClics onCambio={onCambio} />
        <SeguirCoordenadas lat={lat} lng={lng} />
        {valida && (
          <Marker
            position={[lat, lng]}
            icon={iconoArrastrable}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = (e.target as L.Marker).getLatLng()
                onCambio(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)))
              },
            }}
          />
        )}
      </MapContainer>
      <p className="bg-humo px-3 py-1.5 text-xs text-acero-600 dark:bg-acero-950 dark:text-acero-400">
        Da clic en el mapa o arrastra el marcador para fijar la ubicación.
      </p>
    </div>
  )
}
