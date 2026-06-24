import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIrradianceProfile, peakSunHours } from '../../src/lib/solar/irradiance.ts'

test('profile preserves the annual total', () => {
  const p = buildIrradianceProfile(40, 1700)
  assert.ok(Math.abs(p.annualGHI - 1700) < 2)
  const sumTotals = p.monthlyTotalGHI.reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(sumTotals - 1700) < 2)
})

test('profile has 12 non-negative months', () => {
  const p = buildIrradianceProfile(35, 1500)
  assert.equal(p.monthlyDailyGHI.length, 12)
  assert.equal(p.monthlyTotalGHI.length, 12)
  assert.ok(p.monthlyDailyGHI.every((v) => v >= 0))
})

test('high latitude has strong seasonality; equator is flat', () => {
  const hi = buildIrradianceProfile(60, 1000)
  const jul = hi.monthlyDailyGHI[6]
  const jan = hi.monthlyDailyGHI[0]
  assert.ok(jul > jan * 3) // strong summer peak in the north

  const eq = buildIrradianceProfile(0, 2000)
  const max = Math.max(...eq.monthlyDailyGHI)
  const min = Math.min(...eq.monthlyDailyGHI)
  assert.ok(max / min < 1.5) // near-flat at the equator
})

test('southern hemisphere peaks in the southern summer', () => {
  const s = buildIrradianceProfile(-35, 1600)
  assert.ok(s.monthlyDailyGHI[0] > s.monthlyDailyGHI[6]) // Jan > Jul
})

test('peakSunHours = annualGHI / 365', () => {
  assert.ok(Math.abs(peakSunHours(1460) - 4) < 1e-9)
})
