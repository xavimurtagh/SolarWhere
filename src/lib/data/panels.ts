/**
 * Photovoltaic module archetypes. Specs are representative of mainstream 2024
 * products in three tiers. Efficiency = wattage / (area × 1000 W/m²).
 */

import type { PanelSpec } from '../solar/types'

export const PANELS: PanelSpec[] = [
  {
    id: 'budget',
    name: 'Budget mono-PERC (400 W)',
    wattage: 400,
    areaM2: 1.95,
    efficiency: 400 / (1.95 * 1000),
    tempCoeffPctPerC: -0.37,
    degradationPerYear: 0.006,
    noctC: 45,
    tier: 'budget',
  },
  {
    id: 'standard',
    name: 'Standard mono-PERC (430 W)',
    wattage: 430,
    areaM2: 1.92,
    efficiency: 430 / (1.92 * 1000),
    tempCoeffPctPerC: -0.34,
    degradationPerYear: 0.005,
    noctC: 44,
    tier: 'standard',
  },
  {
    id: 'premium',
    name: 'Premium n-type TOPCon (445 W)',
    wattage: 445,
    areaM2: 1.84,
    efficiency: 445 / (1.84 * 1000),
    tempCoeffPctPerC: -0.29,
    degradationPerYear: 0.004,
    noctC: 42,
    tier: 'premium',
  },
]

export const DEFAULT_PANEL = PANELS[1]

export function findPanel(id: string): PanelSpec {
  return PANELS.find((p) => p.id === id) ?? DEFAULT_PANEL
}
