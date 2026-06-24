import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BATTERY_SIZES,
  computeEnergyFlow,
  suggestBatterySize,
} from '../../src/lib/solar/battery.ts'

const consumption = { annualKWh: 4500, daytimeFraction: 0.3 }

test('battery monotonically increases self-consumption', () => {
  let prev = -1
  for (const b of [0, 5, 10, 20]) {
    const f = computeEnergyFlow(5000, consumption, b)
    assert.ok(f.selfConsumptionFraction >= prev)
    prev = f.selfConsumptionFraction
  }
})

test('self-sufficiency never exceeds 1 and equals selfConsumed/consumption', () => {
  const f = computeEnergyFlow(9000, consumption, 20)
  assert.ok(f.selfSufficiencyFraction <= 1.0001)
  assert.ok(Math.abs(f.selfSufficiencyFraction - f.selfConsumedKWh / consumption.annualKWh) < 1e-6)
})

test('energy is conserved: self-consumed + exported ≤ generation', () => {
  const gen = 5000
  const f = computeEnergyFlow(gen, consumption, 10)
  assert.ok(f.selfConsumedKWh + f.exportedKWh <= gen + 1e-6)
  assert.ok(Math.abs(f.gridImportKWh - (consumption.annualKWh - f.selfConsumedKWh)) < 1e-6)
})

test('zero generation produces zero flows', () => {
  const f = computeEnergyFlow(0, consumption, 10)
  assert.equal(f.selfConsumedKWh, 0)
  assert.equal(f.exportedKWh, 0)
  assert.equal(f.batteryContributionKWh, 0)
})

test('no battery → no battery contribution', () => {
  const f = computeEnergyFlow(5000, consumption, 0)
  assert.equal(f.batteryContributionKWh, 0)
})

test('suggestBatterySize returns a standard non-zero size', () => {
  const s = suggestBatterySize(6000, consumption)
  assert.ok(s > 0)
  assert.ok(BATTERY_SIZES.includes(s))
})
