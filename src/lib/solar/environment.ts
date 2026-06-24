/**
 * Environmental impact: CO₂ avoided plus relatable equivalencies and the
 * energy payback time of the system.
 */

import type { EnvironmentResult } from './types'

// Equivalency factors.
const KG_CO2_PER_TREE_YEAR = 21 // mature tree annual sequestration
const KG_CO2_PER_CAR_YEAR = 4600 // average passenger car (EPA ~4.6 t/yr)
const KG_CO2_PER_FLIGHT = 500 // one-way transatlantic economy seat
const EMBODIED_KWH_PER_KWP = 1500 // manufacturing energy, approx.

export function computeEnvironment(
  systemSizeKWp: number,
  annualGenerationKWh: number,
  lifetimeGenerationKWh: number,
  gridCarbonKgPerKWh: number,
): EnvironmentResult {
  const annualCO2Kg = annualGenerationKWh * gridCarbonKgPerKWh
  const lifetimeCO2Kg = lifetimeGenerationKWh * gridCarbonKgPerKWh
  const embodiedKWh = systemSizeKWp * EMBODIED_KWH_PER_KWP

  return {
    annualCO2Kg,
    lifetimeCO2Kg,
    // Trees & cars expressed on an annual basis; flights over the lifetime.
    treesEquivalent: annualCO2Kg / KG_CO2_PER_TREE_YEAR,
    carsEquivalent: annualCO2Kg / KG_CO2_PER_CAR_YEAR,
    flightsEquivalent: lifetimeCO2Kg / KG_CO2_PER_FLIGHT,
    energyPaybackYears:
      annualGenerationKWh > 0 ? embodiedKWh / annualGenerationKWh : Infinity,
  }
}
