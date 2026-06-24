import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  azimuthLabel,
  formatKWh,
  formatMoney,
  formatNumber,
  formatPercent,
  formatTonnes,
  formatYears,
} from '../../src/lib/format.ts'

test('formatNumber handles non-finite', () => {
  assert.equal(formatNumber(Infinity), '—')
  assert.equal(formatNumber(NaN), '—')
  assert.equal(formatNumber(1234), '1,234')
})

test('formatMoney compacts thousands and millions', () => {
  assert.equal(formatMoney(500), '$500')
  assert.equal(formatMoney(12000), '$12.0k')
  assert.equal(formatMoney(3_400_000), '$3.40M')
  assert.equal(formatMoney(-12000), '-$12.0k')
  assert.equal(formatMoney(100, '£'), '£100')
})

test('formatKWh scales to MWh and GWh', () => {
  assert.equal(formatKWh(500), '500 kWh')
  assert.equal(formatKWh(15000), '15.0 MWh')
  assert.equal(formatKWh(2_000_000), '2.00 GWh')
})

test('formatPercent and formatYears', () => {
  assert.equal(formatPercent(0.25), '25%')
  assert.equal(formatYears(Infinity), 'never')
  assert.equal(formatYears(7.25), '7.3 yr')
})

test('azimuthLabel maps degrees to cardinals', () => {
  assert.equal(azimuthLabel(0), 'N')
  assert.equal(azimuthLabel(90), 'E')
  assert.equal(azimuthLabel(180), 'S')
  assert.equal(azimuthLabel(270), 'W')
  assert.equal(azimuthLabel(360), 'N')
})

test('formatTonnes scales kg → t → kt', () => {
  assert.equal(formatTonnes(500), '500 kg')
  assert.equal(formatTonnes(2500), '2.5 t')
  assert.equal(formatTonnes(2_000_000), '2.0 kt')
})
