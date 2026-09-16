import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { Parque } from '../lib/tipos'
import { COLOR_SECTOR } from '../lib/tipos'

// Encuadre inicial: todo México.
const CENTRO_MX: [number, number] = [23.6, -102.5]
const ZOOM_MX = 5

/** Crea el pin de color según el sector; el seleccionado lleva la clase "activo" (pulso). */
function iconoParque(parque: Parque, activo: boolean) {
  return L.divIcon({
    className: `marcador-parque${activo ? ' activo' : ''}`,
    html: `<div class="marcador-pin" style="background:${COLOR_SECTOR[parque.sector]}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  })
}

function iconoGrupo(cluster: { getChildCount: () => number }) {
  const n = cluster.getChildCount()
  const tam = n < 10 ? 36 : n < 50 ? 44 : 52
  return L.divIcon({
    html: `<div class="grupo-marcadores" style="width:${tam}px;height:${tam}px">${n}</div>`,
    className: 'marcador-parque',
    iconSize: L.point(tam, tam, true),
  })
}

/**
 * Ajusta el encuadre del mapa a los resultados visibles cada vez que cambian.
 * Importante: si el contenedor todavía no tiene alto (primer render, o el
 * panel estaba oculto), Leaflet calcula NaN al animar. Por eso comprobamos
 * el tamaño y, si es cero, colocamos la vista sin animación.
 */
function AjustarEncuadre({ parques }: { parques: Parque[] }) {
  const mapa = useMap()
  const firma = parques.map((p) => p.id).join(',')

  useEffect(() => {
    const mover = () => {
      mapa.invalidateSize({ animate: false })
      const tam = mapa.getSize()
      const animar = tam.x > 0 && tam.y > 0

      if (parques.length === 0) {
        mapa.setView(CENTRO_MX, ZOOM_MX, { animate: animar, duration: 0.6 })
        return
      }
      if (parques.length === 1) {
        mapa.setView([parques[0].lat, parques[0].lng], 11, { animate: animar, duration: 0.6 })
        return
      }
      const limites = L.latLngBounds(parques.map((p) => [p.lat, p.lng] as [number, number]))
      if (!animar) {
        mapa.fitBounds(limites, { padding: [60, 60], maxZoom: 12, animate: false })
        return
      }
      mapa.flyToBounds(limites, { padding: [60, 60], maxZoom: 12, duration: 0.6 })
    }

    // Un frame de margen para que el layout ya tenga medidas reales.
    const id = requestAnimationFrame(mover)
    return () => cancelAnimationFrame(id)
    // Depende de la firma (los ids), no del arreglo, para no reencuadrar de más.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, mapa])

  return null
}

/** Centra el mapa en el parque abierto en la ficha. */
function CentrarEnSeleccion({ parque }: { parque: Parque | null }) {
  const mapa = useMap()
  useEffect(() => {
    if (!parque) return
    const tam = mapa.getSize()
    if (tam.x === 0 || tam.y === 0) return
    mapa.flyTo([parque.lat, parque.lng], Math.max(mapa.getZoom(), 10), { duration: 0.5 })
  }, [parque, mapa])
  return null
}

interface Props {
  parques: Parque[]
  idResaltado: string | null
  idSeleccionado: string | null
  onSeleccionar: (parque: Parque) => void
  onResaltar: (id: string | null) => void
}

export function Mapa({ parques, idResaltado, idSeleccionado, onSeleccionar, onResaltar }: Props) {
  const seleccionado = useMemo(
    () => parques.find((p) => p.id === idSeleccionado) ?? null,
    [parques, idSeleccionado],
  )
  // Forzamos que el grupo de clusters se recree al cambiar los resultados.
  const claveGrupo = useRef(0)
  claveGrupo.current = parques.length

  return (
    <MapContainer
      center={CENTRO_MX}
      zoom={ZOOM_MX}
      minZoom={4}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <AjustarEncuadre parques={parques} />
      <CentrarEnSeleccion parque={seleccionado} />

      <MarkerClusterGroup
        key={`grupo-${parques.map((p) => p.id).join('|').length}`}
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={55}
        spiderfyOnMaxZoom
        iconCreateFunction={iconoGrupo}
      >
        {parques.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={iconoParque(p, p.id === idResaltado || p.id === idSeleccionado)}
            title={p.nombre}
            eventHandlers={{
              click: () => onSeleccionar(p),
              mouseover: () => onResaltar(p.id),
              mouseout: () => onResaltar(null),
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
