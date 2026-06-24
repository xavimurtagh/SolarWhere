import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  USABLE_FRACTION,
  moduleWpPerM2,
  sizeFromArea,
  sizeFromCapacity,
} from '../../src/lib/solar/system.ts'
import { DEFAULT_PANEL } from '../../src/lib/data/panels.ts'

test('usable fractions are sensible (0,1]', () => {
  for (const v of Object.values(USABLE_FRACTION)) {
    assert.ok(v > 0 && v <= 1)
  }
})

test('moduleWpPerM2 = wattage / area', () => {
  assert.ok(Math.abs(moduleWpPerM2(DEFAULT_PANEL) - DEFAULT_PANEL.wattage / DEFAULT_PANEL.areaM2) < 1e-9)
})

test('sizeFromArea: zero area → zero panels', () => {
  const s = sizeFromArea(0, 'roof-pitched', DEFAULT_PANEL)
  assert.equal(s.panelCount, 0)
  assert.equal(s.systemSizeKWp, 0)
})

test('sizeFromArea: larger area → more panels, modules fit within usable area', () => {
  const small = sizeFromArea(30, 'roof-pitched', DEFAULT_PANEL)
  const big = sizeFromArea(120, 'roof-pitched', DEFAULT_PANEL)
  assert.ok(big.panelCount > small.panelCount)
  assert.ok(big.moduleAreaM2 <= 120 * USABLE_FRACTION['roof-pitched'] + 1e-6)
  assert.ok(Math.abs(big.systemSizeKWp - (big.panelCount * DEFAULT_PANEL.wattage) / 1000) < 1e-9)
})

test('sizeFromCapacity: panel count rounds to capacity and infers gross area', () => {
  const s = sizeFromCapacity(5, 'roof-pitched', DEFAULT_PANEL)
  assert.equal(s.panelCount, Math.round((5 * 1000) / DEFAULT_PANEL.wattage))
  assert.ok(s.grossAreaM2 > s.moduleAreaM2) // gross > module due to packing
  assert.ok(Math.abs(s.moduleAreaM2 - s.panelCount * DEFAULT_PANEL.areaM2) < 1e-9)
})

test('field packing is sparser than pitched roof', () => {
  assert.ok(USABLE_FRACTION['ground-field'] < USABLE_FRACTION['roof-pitched'])
})
