/** Geographic helpers for the area-drawing tool. */

export type LatLngTuple = [number, number]

const EARTH_RADIUS_M = 6_378_137

/**
 * Planar area (m²) of a lat/lng polygon using a local equirectangular
 * projection about the polygon centroid + the shoelace formula. Accurate for
 * the small areas (roofs, fields) this tool deals with.
 */
export function polygonAreaM2(points: LatLngTuple[]): number {
  if (points.length < 3) return 0
  const lat0 =
    (points.reduce((s, p) => s + p[0], 0) / points.length) * (Math.PI / 180)
  const cosLat0 = Math.cos(lat0)

  const xy = points.map(([lat, lng]) => {
    const x = (lng * Math.PI) / 180 * EARTH_RADIUS_M * cosLat0
    const y = (lat * Math.PI) / 180 * EARTH_RADIUS_M
    return [x, y] as LatLngTuple
  })

  let area = 0
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i]
    const [x2, y2] = xy[(i + 1) % xy.length]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

/** Centroid of a set of points. */
export function centroid(points: LatLngTuple[]): LatLngTuple {
  if (points.length === 0) return [0, 0]
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length
  return [lat, lng]
}
