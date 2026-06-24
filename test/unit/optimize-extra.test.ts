import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  capacityForCO2Target,
  lcoeLifetime,
  abatementCost,
  simplePayback,
  parseSitesCSV,
  serializeSitesCSV,
  type SiteCSVRow,
} from '../../src/lib/solar/optimize.ts'

test('capacityForCO2Target scales linearly with the target', () => {
  const base = capacityForCO2Target(1000, 1500, 0.5)
  const double = capacityForCO2Target(2000, 1500, 0.5)
  assert.ok(base > 0)
  assert.ok(Math.abs(double - base * 2) < 1e-6)
})

test('capacityForCO2Target scales inversely with the grid carbon factor', () => {
  const dirty = capacityForCO2Target(1000, 1500, 0.8)
  const clean = capacityForCO2Target(1000, 1500, 0.4)
  // Halving the carbon factor doubles the capacity needed for the same abatement.
  assert.ok(Math.abs(clean - dirty * 2) < 1e-6)
})

test('capacityForCO2Target returns the analytically expected value', () => {
  // 500 t/yr @ 0.5 kg/kWh => 1,000,000 kWh/yr; @ 1000 kWh/kWp => 1000 kWp.
  assert.equal(capacityForCO2Target(500, 1000, 0.5), 1000)
})

test('capacityForCO2Target handles zero / invalid inputs gracefully', () => {
  assert.equal(capacityForCO2Target(1000, 1500, 0), 0)
  assert.equal(capacityForCO2Target(0, 1500, 0.5), 0)
  assert.equal(capacityForCO2Target(1000, 0, 0.5), 0)
  assert.equal(capacityForCO2Target(-50, 1500, 0.5), 0)
})

test('cost-efficiency helpers compute and guard divide-by-zero', () => {
  // capex 1,000,000; gen 100,000 kWh/yr over 25 yr => 2,500,000 kWh => $0.40/kWh.
  assert.ok(Math.abs(lcoeLifetime(1_000_000, 100_000, 25) - 0.4) < 1e-9)
  // capex 1,000,000; 50,000 kg/yr => 50 t/yr => 1,250 t over 25 yr => $800/t.
  assert.ok(Math.abs(abatementCost(1_000_000, 50_000, 25) - 800) < 1e-9)
  // capex 1,000,000; savings 200,000/yr => 5 yr payback.
  assert.ok(Math.abs(simplePayback(1_000_000, 200_000) - 5) < 1e-9)

  assert.equal(lcoeLifetime(1_000_000, 0), Infinity)
  assert.equal(abatementCost(1_000_000, 0), Infinity)
  assert.equal(simplePayback(1_000_000, 0), Infinity)
})

test('serializeSitesCSV emits a header and clean rows', () => {
  const csv = serializeSitesCSV([
    { name: 'HQ roof', regionId: 'uk-london', capacityKWp: 250 },
  ])
  const lines = csv.split('\n')
  assert.equal(lines[0], 'name,regionId,capacityKWp')
  assert.equal(lines[1], 'HQ roof,uk-london,250')
})

test('CSV serialize -> parse round-trips', () => {
  const sites: SiteCSVRow[] = [
    { name: 'HQ rooftop', regionId: 'us-losangeles', capacityKWp: 250 },
    { name: 'Warehouse', regionId: 'es-madrid', capacityKWp: 800 },
  ]
  const parsed = parseSitesCSV(serializeSitesCSV(sites))
  assert.deepEqual(parsed, sites)
})

test('parseSitesCSV tolerates a header, blank lines and quoted commas', () => {
  const csv = [
    'name,regionId,capacityKWp',
    '',
    '"Depot, north","uk-london",400',
    'No region given,,', // capacity defaults & clamps to 1
  ].join('\n')
  const parsed = parseSitesCSV(csv)
  assert.equal(parsed.length, 2)
  assert.deepEqual(parsed[0], {
    name: 'Depot, north',
    regionId: 'uk-london',
    capacityKWp: 400,
  })
  assert.equal(parsed[1].capacityKWp, 1)
})

test('parseSitesCSV clamps capacity to at least 1', () => {
  const parsed = parseSitesCSV('Tiny,uk-london,-5\nZero,uk-london,0')
  assert.equal(parsed[0].capacityKWp, 1)
  assert.equal(parsed[1].capacityKWp, 1)
})
