import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  batteryCapex,
  batteryCostPerKWh,
  costPerWatt,
  inverterReplacementCost,
  systemCapex,
} from '../../src/lib/solar/costs.ts'

test('cost per watt falls with system size (economies of scale)', () => {
  assert.ok(costPerWatt(5) > costPerWatt(100))
  assert.ok(costPerWatt(100) > costPerWatt(5000))
})

test('regional multiplier scales cost linearly', () => {
  assert.ok(Math.abs(costPerWatt(10, 0.5) - costPerWatt(10, 1) * 0.5) < 1e-9)
})

test('systemCapex = kWp * 1000 * $/W', () => {
  const perW = costPerWatt(10)
  assert.ok(Math.abs(systemCapex(10) - 10 * 1000 * perW) < 1e-6)
})

test('override $/W is respected', () => {
  assert.ok(Math.abs(systemCapex(10, 1, 2) - 20000) < 1e-6)
})

test('battery cost: zero when no battery, falls with size', () => {
  assert.equal(batteryCapex(0), 0)
  assert.equal(batteryCostPerKWh(0), 0)
  assert.ok(batteryCostPerKWh(5) > batteryCostPerKWh(200))
})

test('inverter replacement ≈ $0.13/W', () => {
  assert.ok(Math.abs(inverterReplacementCost(10) - 10 * 1000 * 0.13) < 1e-6)
})

test('cost curve is clamped at the anchor endpoints', () => {
  // Below the smallest and above the largest anchor it should be finite & bounded.
  assert.ok(costPerWatt(0.1) >= costPerWatt(3) - 1e-9)
  assert.ok(costPerWatt(1e6) <= costPerWatt(20000) + 1e-9)
})
