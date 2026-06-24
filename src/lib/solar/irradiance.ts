/**
 * Builds a monthly irradiance profile from an annual GHI total and latitude.
 *
 * We distribute the annual total across months in proportion to the
 * extraterrestrial radiation available each month (assuming a roughly
 * constant clearness index). This reproduces the dominant, latitude-driven
 * seasonal swing — near-flat at the equator, strongly summer-peaked at high
 * latitudes — while exactly preserving the location's measured annual total.
 */

import {
  DAYS_IN_MONTH,
  REP_DAY_OF_YEAR,
  extraterrestrialDaily,
  toRad,
} from './geometry'

export interface IrradianceProfile {
  /** Monthly daily-average GHI, kWh/m²/day (length 12, Jan–Dec). */
  monthlyDailyGHI: number[]
  /** Monthly total GHI, kWh/m²/month (length 12). */
  monthlyTotalGHI: number[]
  /** Annual total, kWh/m²/year. */
  annualGHI: number
}

export function buildIrradianceProfile(
  latDeg: number,
  annualGHI: number,
): IrradianceProfile {
  const latRad = toRad(latDeg)

  // Monthly extraterrestrial totals (kWh/m²/month) set the seasonal shape.
  const extraMonthly = REP_DAY_OF_YEAR.map(
    (n, i) => extraterrestrialDaily(n, latRad) * DAYS_IN_MONTH[i],
  )
  const extraAnnual = extraMonthly.reduce((a, b) => a + b, 0)

  // Scale so the synthesized annual GHI equals the supplied value.
  const scale = extraAnnual > 0 ? annualGHI / extraAnnual : 0
  const monthlyTotalGHI = extraMonthly.map((e) => e * scale)
  const monthlyDailyGHI = monthlyTotalGHI.map((t, i) => t / DAYS_IN_MONTH[i])

  return {
    monthlyDailyGHI,
    monthlyTotalGHI,
    annualGHI: monthlyTotalGHI.reduce((a, b) => a + b, 0),
  }
}

/** Average daily peak-sun-hours (equivalent full-sun hours) for a profile. */
export function peakSunHours(annualGHI: number): number {
  return annualGHI / 365
}
