/**
 * Convenience layer between the UI/tests and the engine: merges regional
 * defaults with user choices to build a full `AssessmentInput`, then runs it.
 */

import { assessSite } from './solar'
import type {
  AssessmentInput,
  AssessmentResult,
  ConsumptionProfile,
  FinanceParams,
  Orientation,
  PanelSpec,
  RegionData,
  SurfaceType,
  Tariff,
} from './solar/types'

export interface BuildParams {
  region: RegionData
  surfaceType: SurfaceType
  areaM2?: number
  systemSizeKWp?: number
  orientation: Orientation
  shadingFraction: number
  albedo?: number
  panel: PanelSpec
  consumption: ConsumptionProfile
  batteryKWh: number
  /** Optional overrides. */
  tariff?: Partial<Tariff>
  finance?: Partial<FinanceParams>
  costOverridePerWatt?: number
  batteryCostPerKWh?: number
}

export function buildAssessmentInput(p: BuildParams): AssessmentInput {
  const tariff: Tariff = {
    currency: p.region.currency,
    importPrice: p.region.electricityPrice,
    exportPrice: p.region.exportPrice,
    priceInflationPerYear: 0.03,
    standingChargePerYear: 0,
    ...p.tariff,
  }
  const finance: FinanceParams = {
    discountRatePerYear: 0.05,
    analysisYears: 25,
    upfrontSubsidyFraction: p.region.incentiveFraction,
    upfrontSubsidyFixed: 0,
    omFractionPerYear: 0.01,
    ...p.finance,
  }
  return {
    location: { lat: p.region.lat, lon: p.region.lon },
    hemisphere: p.region.hemisphere,
    surfaceType: p.surfaceType,
    areaM2: p.areaM2,
    systemSizeKWp: p.systemSizeKWp,
    orientation: p.orientation,
    shadingFraction: p.shadingFraction,
    albedo: p.albedo ?? 0.2,
    panel: p.panel,
    consumption: p.consumption,
    batteryKWh: p.batteryKWh,
    tariff,
    finance,
    annualGHI: p.region.annualGHI,
    avgTempC: p.region.avgTempC,
    gridCarbonKgPerKWh: p.region.gridCarbonKgPerKWh,
    costMultiplier: p.region.costMultiplier,
    costOverridePerWatt: p.costOverridePerWatt,
    batteryCostPerKWh: p.batteryCostPerKWh,
  }
}

export function runAssessment(p: BuildParams): AssessmentResult {
  return assessSite(buildAssessmentInput(p))
}
