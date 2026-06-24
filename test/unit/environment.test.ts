import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeEnvironment } from '../../src/lib/solar/environment.ts'

test('CO2 scales with generation and carbon intensity', () => {
  const e = computeEnvironment(5, 5000, 120000, 0.4)
  assert.ok(Math.abs(e.annualCO2Kg - 5000 * 0.4) < 1e-6)
  assert.ok(Math.abs(e.lifetimeCO2Kg - 120000 * 0.4) < 1e-6)
})

test('equivalents are positive and scale with CO2', () => {
  const a = computeEnvironment(5, 5000, 120000, 0.4)
  const b = computeEnvironment(10, 10000, 240000, 0.4)
  assert.ok(a.treesEquivalent > 0 && a.carsEquivalent > 0 && a.flightsEquivalent > 0)
  assert.ok(b.treesEquivalent > a.treesEquivalent)
})

test('energy payback time = embodied / annual generation', () => {
  const e = computeEnvironment(5, 7500, 180000, 0.4)
  // embodied = 5 * 1500 = 7500 kWh → EPBT ≈ 1 yr
  assert.ok(Math.abs(e.energyPaybackYears - 1) < 1e-6)
})

test('zero generation → infinite energy payback, zero CO2', () => {
  const e = computeEnvironment(5, 0, 0, 0.4)
  assert.equal(e.annualCO2Kg, 0)
  assert.equal(e.energyPaybackYears, Infinity)
})
