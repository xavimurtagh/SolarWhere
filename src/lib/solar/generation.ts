/**
 * Energy yield model.
 *
 * Generation = installed kWp × plane-of-array irradiation × performance ratio
 *              × (1 − shading), degraded year on year.
 *
 * The performance ratio (PR) is built from its physical components, with the
 * temperature term derived from the local climate so hot regions are penalised
 * appropriately.
 */

import { transpose } from './geometry'
import type {
  GenerationResult,
  Orientation,
  PanelSpec,
  PerformanceRatio,
} from './types'
import { clamp } from './geometry'

/** Energy-weighted average operating irradiance, W/m² (for cell-temp rise). */
const OPERATING_IRRADIANCE = 700

/**
 * Build the performance ratio from component losses. The temperature factor
 * uses the NOCT model and the site's mean ambient temperature.
 */
export function performanceRatio(
  panel: PanelSpec,
  avgTempC: number,
): PerformanceRatio {
  const cellTempRise = ((panel.noctC - 20) / 800) * OPERATING_IRRADIANCE
  const avgCellTemp = avgTempC + cellTempRise
  const temperature = clamp(
    1 + (panel.tempCoeffPctPerC / 100) * (avgCellTemp - 25),
    0.8,
    1,
  )
  const inverter = 0.96
  const soiling = 0.97
  const wiringMismatch = 0.97
  const availability = 0.99
  const lid = 0.985 // light-induced degradation (one-off)
  const total =
    inverter * temperature * soiling * wiringMismatch * availability * lid
  return { inverter, temperature, soiling, wiringMismatch, availability, lid, total }
}

export interface GenerationParams {
  latDeg: number
  monthlyDailyGHI: number[]
  orientation: Orientation
  albedo: number
  systemSizeKWp: number
  shadingFraction: number
  panel: PanelSpec
  avgTempC: number
  analysisYears: number
}

export function computeGeneration(p: GenerationParams): GenerationResult {
  const t = transpose(
    p.latDeg,
    p.monthlyDailyGHI,
    p.orientation.tiltDeg,
    p.orientation.azimuthDeg,
    p.albedo,
  )
  const pr = performanceRatio(p.panel, p.avgTempC)
  const shade = clamp(1 - p.shadingFraction, 0, 1)

  const specificYield = t.annualPOA * pr.total * shade
  const monthlyGenerationKWh = t.monthlyPOA.map(
    (poa) => poa * p.systemSizeKWp * pr.total * shade,
  )
  const annualGenerationKWh = monthlyGenerationKWh.reduce((a, b) => a + b, 0)

  const yearlyGenerationKWh: number[] = []
  for (let y = 0; y < p.analysisYears; y++) {
    yearlyGenerationKWh.push(
      annualGenerationKWh * Math.pow(1 - p.panel.degradationPerYear, y),
    )
  }
  const lifetimeGenerationKWh = yearlyGenerationKWh.reduce((a, b) => a + b, 0)

  return {
    annualPOA: t.annualPOA,
    transpositionFactor: t.factor,
    monthlyPOA: t.monthlyPOA,
    performanceRatio: pr,
    specificYield,
    annualGenerationKWh,
    monthlyGenerationKWh,
    yearlyGenerationKWh,
    lifetimeGenerationKWh,
  }
}
