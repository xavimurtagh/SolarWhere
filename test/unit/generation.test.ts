import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeGeneration, performanceRatio } from '../../src/lib/solar/generation.ts'
import { buildIrradianceProfile } from '../../src/lib/solar/irradiance.ts'
import { DEFAULT_PANEL } from '../../src/lib/data/panels.ts'

const profile = buildIrradianceProfile(40, 1700)
const base = {
  latDeg: 40,
  monthlyDailyGHI: profile.monthlyDailyGHI,
  orientation: { tiltDeg: 35, azimuthDeg: 180 },
  albedo: 0.2,
  systemSizeKWp: 5,
  shadingFraction: 0,
  panel: DEFAULT_PANEL,
  avgTempC: 15,
  analysisYears: 25,
}

test('performance ratio is realistic and temperature-sensitive', () => {
  const cool = performanceRatio(DEFAULT_PANEL, 5)
  const hot = performanceRatio(DEFAULT_PANEL, 30)
  assert.ok(cool.total > 0.7 && cool.total < 0.9)
  assert.ok(hot.temperature < cool.temperature) // hotter → worse
})

test('annual = sum of months; yearly degrades; lifetime = sum of years', () => {
  const g = computeGeneration(base)
  const sumMonths = g.monthlyGenerationKWh.reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(sumMonths - g.annualGenerationKWh) < 1e-6)
  assert.ok(Math.abs(g.yearlyGenerationKWh[0] - g.annualGenerationKWh) < 1e-6)
  assert.ok(g.yearlyGenerationKWh[24] < g.yearlyGenerationKWh[0]) // degradation
  const sumYears = g.yearlyGenerationKWh.reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(sumYears - g.lifetimeGenerationKWh) < 1e-6)
})

test('shading reduces output proportionally', () => {
  const full = computeGeneration(base)
  const shaded = computeGeneration({ ...base, shadingFraction: 0.25 })
  assert.ok(Math.abs(shaded.annualGenerationKWh / full.annualGenerationKWh - 0.75) < 0.01)
})

test('zero system size yields zero generation', () => {
  const g = computeGeneration({ ...base, systemSizeKWp: 0 })
  assert.equal(g.annualGenerationKWh, 0)
  assert.ok(g.specificYield > 0) // specific yield is per-kWp, independent of size
})
