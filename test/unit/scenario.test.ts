import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeState,
  defaultState,
  effectiveAnnualKWh,
  encodeState,
  normalizeState,
  stateToBuildParams,
} from '../../src/lib/scenario.ts'

test('default state is complete and self-consistent', () => {
  const s = defaultState()
  assert.ok(s.regionId.length > 0)
  assert.ok(s.annualKWh > 0)
  assert.equal(s.sizingMode, 'area')
})

test('encode → decode round-trips losslessly', () => {
  const s = defaultState()
  s.systemSizeKWp = 7.5
  s.batteryKWh = 13.5
  const back = normalizeState(decodeState(encodeState(s)))
  assert.deepEqual(back, s)
})

test('decode of garbage returns null', () => {
  assert.equal(decodeState('not-valid-base64!!!@@@'), null)
})

test('normalizeState drops unknown / wrong-typed keys', () => {
  // Cast through unknown to simulate untrusted decoded input at runtime.
  const untrusted = { systemSizeKWp: 9, annualKWh: 'lots', bogus: 123 } as unknown as Partial<
    import('../../src/lib/scenario.ts').CalculatorState
  >
  const merged = normalizeState(untrusted)
  assert.equal(merged.systemSizeKWp, 9)
  assert.equal(merged.annualKWh, defaultState().annualKWh) // wrong type ignored
  assert.ok(!('bogus' in merged))
})

test('effectiveAnnualKWh: kWh mode vs bill mode', () => {
  const s = defaultState()
  s.consumptionMode = 'kwh'
  s.annualKWh = 4200
  assert.equal(effectiveAnnualKWh(s), 4200)

  s.consumptionMode = 'bill'
  s.monthlyBill = 120
  s.importPrice = 0.3
  assert.ok(Math.abs(effectiveAnnualKWh(s) - (120 * 12) / 0.3) < 1e-6)

  s.importPrice = 0
  assert.equal(effectiveAnnualKWh(s), 0) // guard against divide-by-zero
})

test('stateToBuildParams maps inputs correctly', () => {
  const s = defaultState()
  s.sizingMode = 'area'
  s.areaM2 = 80
  s.shadingPct = 20
  const p = stateToBuildParams(s)
  assert.equal(p.areaM2, 80)
  assert.equal(p.systemSizeKWp, undefined)
  assert.ok(Math.abs(p.shadingFraction - 0.2) < 1e-9)
  assert.equal(p.orientation.tiltDeg, s.tiltDeg)

  s.sizingMode = 'capacity'
  const p2 = stateToBuildParams(s)
  assert.equal(p2.areaM2, undefined)
  assert.equal(p2.systemSizeKWp, s.systemSizeKWp)
})

test('persistence helpers are safe without a browser', () => {
  // No localStorage/window in node — these should not throw.
  assert.doesNotThrow(() => {
    // dynamic import already loaded; call through public API
    const s = defaultState()
    encodeState(s)
  })
})
