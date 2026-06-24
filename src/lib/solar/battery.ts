/**
 * Energy-flow & battery model.
 *
 * Splits annual generation into self-consumed (used on-site), exported (sold to
 * the grid) and the remaining grid import the site still needs. A battery
 * time-shifts daytime surplus into evening/night load.
 *
 * The model is a transparent, energy-conserving daily-bucket approximation:
 *  - Direct self-consumption saturates at the daytime load (exponential),
 *    capturing intra-day timing mismatch.
 *  - The battery stores up to one cycle/day of surplus, limited by remaining
 *    unmet load and round-trip efficiency.
 */

import { clamp } from './geometry'
import type { ConsumptionProfile, EnergyFlowResult } from './types'

const ROUND_TRIP_EFFICIENCY = 0.9

export function computeEnergyFlow(
  annualGenerationKWh: number,
  consumption: ConsumptionProfile,
  batteryKWh: number,
): EnergyFlowResult {
  const A = Math.max(0, annualGenerationKWh)
  const C = Math.max(1, consumption.annualKWh)
  const d = clamp(consumption.daytimeFraction, 0.05, 0.95)
  const dayLoad = C * d

  // Direct daytime self-consumption (saturates at daytime load).
  const direct = dayLoad * (1 - Math.exp(-A / Math.max(dayLoad, 1)))
  const surplus = Math.max(0, A - direct)
  const unmetLoad = Math.max(0, C - direct)

  // Battery: one cycle/day, capped by surplus, unmet load and round-trip loss.
  const annualBatteryCapacity = batteryKWh * 365
  const energyIntoBattery = Math.min(
    annualBatteryCapacity,
    surplus,
    unmetLoad / ROUND_TRIP_EFFICIENCY,
  )
  const batteryContributionKWh = energyIntoBattery * ROUND_TRIP_EFFICIENCY

  const selfConsumedKWh = direct + batteryContributionKWh
  const exportedKWh = Math.max(0, surplus - energyIntoBattery)
  const gridImportKWh = Math.max(0, C - selfConsumedKWh)

  return {
    selfConsumptionFraction: A > 0 ? selfConsumedKWh / A : 0,
    selfSufficiencyFraction: selfConsumedKWh / C,
    selfConsumedKWh,
    exportedKWh,
    gridImportKWh,
    batteryContributionKWh,
  }
}

/** Common off-the-shelf usable battery sizes, kWh. */
export const BATTERY_SIZES = [0, 5, 10, 13.5, 15, 20, 27, 40]

/**
 * Suggest a usable battery capacity (kWh) that roughly matches the smaller of
 * the daily surplus and the evening/night load — the point of diminishing
 * returns for self-consumption.
 */
export function suggestBatterySize(
  annualGenerationKWh: number,
  consumption: ConsumptionProfile,
): number {
  const C = Math.max(1, consumption.annualKWh)
  const d = clamp(consumption.daytimeFraction, 0.05, 0.95)
  const flow = computeEnergyFlow(annualGenerationKWh, consumption, 0)
  const dailySurplus = flow.exportedKWh / 365
  const nightLoadDaily = (C * (1 - d)) / 365
  const target = Math.min(dailySurplus, nightLoadDaily)
  // Snap up to the nearest standard product size.
  const sized = BATTERY_SIZES.filter((b) => b > 0)
  return sized.find((b) => b >= target) ?? sized[sized.length - 1]
}
