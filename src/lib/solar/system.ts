/**
 * System sizing: translate a physical surface (or a desired capacity) into a
 * concrete array — number of modules, installed kWp and occupied area.
 */

import type { PanelSpec, SizingResult, SurfaceType } from './types'

/**
 * Fraction of gross area that can actually be covered by modules. Roofs lose
 * area to edges, vents and setbacks; flat roofs and fields lose area to the
 * inter-row spacing needed to avoid self-shading.
 */
export const USABLE_FRACTION: Record<SurfaceType, number> = {
  'roof-pitched': 0.78,
  'roof-flat': 0.55,
  'ground-field': 0.33,
  carport: 0.65,
  facade: 0.62,
}

export interface SurfaceMeta {
  type: SurfaceType
  label: string
  description: string
  /** Suggested default tilt for this surface, degrees. */
  defaultTilt: number
  icon: string
}

export const SURFACE_TYPES: SurfaceMeta[] = [
  {
    type: 'roof-pitched',
    label: 'Pitched roof',
    description: 'Sloped residential or commercial roof — panels follow the roof pitch.',
    defaultTilt: 35,
    icon: '🏠',
  },
  {
    type: 'roof-flat',
    label: 'Flat roof',
    description: 'Flat commercial/industrial roof — panels on tilted frames with row spacing.',
    defaultTilt: 10,
    icon: '🏢',
  },
  {
    type: 'ground-field',
    label: 'Ground / field',
    description: 'Open land — fixed-tilt ground mount. Spacing limits land coverage.',
    defaultTilt: 25,
    icon: '🌾',
  },
  {
    type: 'carport',
    label: 'Solar carport',
    description: 'Canopy over a car park — dual-use shade and generation.',
    defaultTilt: 7,
    icon: '🚗',
  },
  {
    type: 'facade',
    label: 'Facade / wall',
    description: 'Vertical building-integrated PV on a wall.',
    defaultTilt: 90,
    icon: '🧱',
  },
]

/** Module power density, Wp per m² of module (authoritative from the product). */
export function moduleWpPerM2(panel: PanelSpec): number {
  return panel.wattage / panel.areaM2
}

/** Size a system from a gross available area. */
export function sizeFromArea(
  grossAreaM2: number,
  surfaceType: SurfaceType,
  panel: PanelSpec,
): SizingResult {
  const usableFraction = USABLE_FRACTION[surfaceType]
  const usableArea = grossAreaM2 * usableFraction
  const panelCount = Math.max(0, Math.floor(usableArea / panel.areaM2))
  const moduleAreaM2 = panelCount * panel.areaM2
  const systemSizeKWp = (panelCount * panel.wattage) / 1000
  return {
    systemSizeKWp,
    panelCount,
    moduleAreaM2,
    usableFraction,
    grossAreaM2,
    moduleWpPerM2: moduleWpPerM2(panel),
  }
}

/** Size from a desired capacity, inferring the area required. */
export function sizeFromCapacity(
  systemSizeKWp: number,
  surfaceType: SurfaceType,
  panel: PanelSpec,
): SizingResult {
  const usableFraction = USABLE_FRACTION[surfaceType]
  const panelCount = Math.max(0, Math.round((systemSizeKWp * 1000) / panel.wattage))
  const moduleAreaM2 = panelCount * panel.areaM2
  const grossAreaM2 = usableFraction > 0 ? moduleAreaM2 / usableFraction : 0
  return {
    systemSizeKWp: (panelCount * panel.wattage) / 1000,
    panelCount,
    moduleAreaM2,
    usableFraction,
    grossAreaM2,
    moduleWpPerM2: moduleWpPerM2(panel),
  }
}
