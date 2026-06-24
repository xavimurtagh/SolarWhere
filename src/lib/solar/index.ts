/**
 * SolarWhere engine — public API.
 *
 * `assessSite` runs the full pipeline: irradiance → sizing → generation →
 * energy flow/battery → finance → environment, and returns a single rich
 * result object consumed by the UI.
 */

import { computeEnergyFlow } from './battery'
import {
  batteryCapex,
  inverterReplacementCost,
  systemCapex,
} from './costs'
import { computeEnvironment } from './environment'
import { computeFinance } from './finance'
import { computeGeneration } from './generation'
import { findOptimalOrientation, transpose } from './geometry'
import { buildIrradianceProfile } from './irradiance'
import { sizeFromArea, sizeFromCapacity } from './system'
import type { AssessmentInput, AssessmentResult } from './types'

export function assessSite(input: AssessmentInput): AssessmentResult {
  const profile = buildIrradianceProfile(input.location.lat, input.annualGHI)

  // 1. Sizing
  const sizing =
    input.systemSizeKWp != null
      ? sizeFromCapacity(input.systemSizeKWp, input.surfaceType, input.panel)
      : sizeFromArea(input.areaM2 ?? 0, input.surfaceType, input.panel)

  // 2. Generation
  const generation = computeGeneration({
    latDeg: input.location.lat,
    monthlyDailyGHI: profile.monthlyDailyGHI,
    orientation: input.orientation,
    albedo: input.albedo,
    systemSizeKWp: sizing.systemSizeKWp,
    shadingFraction: input.shadingFraction,
    panel: input.panel,
    avgTempC: input.avgTempC,
    analysisYears: input.finance.analysisYears,
  })

  // 3. Energy flow / battery
  const energyFlow = computeEnergyFlow(
    generation.annualGenerationKWh,
    input.consumption,
    input.batteryKWh,
  )

  // 4. Costs & finance
  const pvCapex = systemCapex(
    sizing.systemSizeKWp,
    costMultiplierOf(input),
    input.costOverridePerWatt,
  )
  const battCapex = batteryCapex(
    input.batteryKWh,
    costMultiplierOf(input),
    input.batteryCostPerKWh,
  )
  const grossCapex = pvCapex + battCapex

  const finance = computeFinance({
    currency: input.tariff.currency,
    grossCapex,
    subsidyFraction: input.finance.upfrontSubsidyFraction,
    subsidyFixed: input.finance.upfrontSubsidyFixed,
    yearlyGenerationKWh: generation.yearlyGenerationKWh,
    selfConsumedFraction:
      generation.annualGenerationKWh > 0
        ? energyFlow.selfConsumedKWh / generation.annualGenerationKWh
        : 0,
    exportedFraction:
      generation.annualGenerationKWh > 0
        ? energyFlow.exportedKWh / generation.annualGenerationKWh
        : 0,
    tariff: input.tariff,
    finance: input.finance,
    inverterReplacementCost: inverterReplacementCost(
      sizing.systemSizeKWp,
      costMultiplierOf(input),
    ),
    inverterReplacementYear: 13,
  })

  // 5. Environment
  const environment = computeEnvironment(
    sizing.systemSizeKWp,
    generation.annualGenerationKWh,
    generation.lifetimeGenerationKWh,
    input.gridCarbonKgPerKWh,
  )

  // 6. Orientation guidance
  const optimal = findOptimalOrientation(
    input.location.lat,
    profile.monthlyDailyGHI,
    input.albedo,
  )
  const chosen = transpose(
    input.location.lat,
    profile.monthlyDailyGHI,
    input.orientation.tiltDeg,
    input.orientation.azimuthDeg,
    input.albedo,
  )
  const orientationEfficiency =
    optimal.annualPOA > 0 ? chosen.annualPOA / optimal.annualPOA : 0

  return {
    input,
    sizing,
    generation,
    energyFlow,
    finance,
    environment,
    optimalOrientation: {
      tiltDeg: optimal.tiltDeg,
      azimuthDeg: optimal.azimuthDeg,
    },
    orientationEfficiency,
  }
}

/** Regional installed-cost multiplier; defaults to the global baseline. */
function costMultiplierOf(input: AssessmentInput): number {
  return input.costMultiplier ?? 1
}

export * from './types'
export * from './geometry'
export * from './irradiance'
export * from './system'
export * from './generation'
export * from './battery'
export * from './costs'
export * from './finance'
export * from './environment'
export * from './optimize'
