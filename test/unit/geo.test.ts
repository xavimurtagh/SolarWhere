import { test } from 'node:test'
import assert from 'node:assert/strict'
import { centroid, polygonAreaM2, type LatLngTuple } from '../../src/lib/geo.ts'

test('area of a known small square at the equator', () => {
  const sq: LatLngTuple[] = [[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0]]
  // 0.001° ≈ 111.32 m each side → ~12,392 m²
  assert.ok(Math.abs(polygonAreaM2(sq) - 12392) < 50)
})

test('longitude shrinks with latitude (cos scaling)', () => {
  const eq = polygonAreaM2([[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0]])
  const ldn = polygonAreaM2([[51.5, 0], [51.5, 0.001], [51.501, 0.001], [51.501, 0]])
  assert.ok(Math.abs(ldn / eq - Math.cos((51.5 * Math.PI) / 180)) < 0.01)
})

test('degenerate polygons have zero area', () => {
  assert.equal(polygonAreaM2([]), 0)
  assert.equal(polygonAreaM2([[0, 0]]), 0)
  assert.equal(polygonAreaM2([[0, 0], [0, 1]]), 0)
})

test('winding direction does not matter', () => {
  const cw: LatLngTuple[] = [[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0]]
  const ccw: LatLngTuple[] = [...cw].reverse()
  assert.ok(Math.abs(polygonAreaM2(cw) - polygonAreaM2(ccw)) < 1e-6)
})

test('centroid is the average of vertices', () => {
  const c = centroid([[0, 0], [0, 2], [2, 2], [2, 0]])
  assert.deepEqual(c, [1, 1])
})
