/**
 * Interactive map area picker. Click to drop polygon vertices around a roof or
 * field; the enclosed area (m²) is computed live and reported upward. Uses
 * OpenStreetMap tiles and Leaflet via react-leaflet. Vertices are drawn as
 * CircleMarkers so no default-marker icon assets are required.
 */
import { useEffect, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { centroid, polygonAreaM2, type LatLngTuple } from '../lib/geo'
import { formatNumber } from '../lib/format'

function ClickCapture({ onAdd }: { onAdd: (p: LatLngTuple) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function RecenterOnChange({ center }: { center: LatLngTuple }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]])
  return null
}

export function MapAreaPicker({
  center,
  onAreaChange,
}: {
  center: LatLngTuple
  onAreaChange: (areaM2: number) => void
}) {
  const [points, setPoints] = useState<LatLngTuple[]>([])

  const area = polygonAreaM2(points)
  useEffect(() => {
    onAreaChange(area)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area])

  const addPoint = (p: LatLngTuple) => setPoints((prev) => [...prev, p])
  const undo = () => setPoints((prev) => prev.slice(0, -1))
  const clear = () => setPoints([])

  return (
    <div className="space-y-2">
      <div className="relative h-[340px] overflow-hidden rounded-2xl border border-ink-200">
        <MapContainer
          center={center}
          zoom={19}
          maxZoom={21}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={21}
          />
          <ClickCapture onAdd={addPoint} />
          <RecenterOnChange center={center} />
          {points.length >= 2 && (
            <Polygon
              positions={points}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.25, weight: 2 }}
            />
          )}
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={p}
              radius={5}
              pathOptions={{ color: '#b45309', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            />
          ))}
        </MapContainer>

        <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl bg-white/95 px-3 py-2 shadow-card">
          <div className="text-[11px] uppercase tracking-wide text-ink-400">Drawn area</div>
          <div className="text-lg font-bold text-ink-900 tnum">
            {formatNumber(area)} m²
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-500">
          🖱️ Click the map to trace your roof or field outline. Add at least 3
          points.
        </p>
        <div className="flex gap-2">
          <button className="btn-outline px-3 py-1.5 text-xs" onClick={undo} disabled={!points.length}>
            Undo
          </button>
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={clear} disabled={!points.length}>
            Clear
          </button>
        </div>
      </div>
      {points.length > 0 && points.length < 3 && (
        <p className="text-xs text-amber-600">Add {3 - points.length} more point(s) to close the shape.</p>
      )}
      <p className="text-[11px] text-ink-400">
        Centre: {center[0].toFixed(3)}, {center[1].toFixed(3)} ·{' '}
        {points.length >= 3 ? `centroid ${centroid(points)[0].toFixed(3)}, ${centroid(points)[1].toFixed(3)}` : 'no polygon yet'}
      </p>
    </div>
  )
}
