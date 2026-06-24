import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  clamp,
  compassToSurfaceAzimuth,
  declination,
  extraterrestrialDaily,
  findOptimalOrientation,
  toDeg,
  toRad,
  transpose,
} from '../../src/lib/solar/geometry.ts'
import { buildIrradianceProfile } from '../../src/lib/solar/irradiance.ts'

test('clamp bounds values', () => {
  assert.equal(clamp(5, 0, 1), 1)
  assert.equal(clamp(-5, 0, 1), 0)
  assert.equal(clamp(0.5, 0, 1), 0.5)
})

test('rad/deg are inverse', () => {
  assert.ok(Math.abs(toDeg(toRad(57)) - 57) < 1e-9)
})

test('declination stays within the axial tilt', () => {
  for (let n = 1; n <= 365; n += 10) {
    assert.ok(Math.abs(toDeg(declination(n))) <= 23.46)
  }
  // Near solstices it approaches the extremes.
  assert.ok(toDeg(declination(172)) > 23) // ~21 Jun
  assert.ok(toDeg(declination(355)) < -23) // ~21 Dec
})

test('extraterrestrial radiation is positive in summer, ~0 in polar winter', () => {
  assert.ok(extraterrestrialDaily(172, toRad(45)) > 8)
  // High-latitude midwinter → polar night → ~0.
  assert.ok(extraterrestrialDaily(355, toRad(80)) < 0.5)
})

test('compass→surface azimuth conversion (0 = due south)', () => {
  assert.equal(compassToSurfaceAzimuth(180), 0)
  assert.equal(compassToSurfaceAzimuth(90), -90)
  assert.equal(compassToSurfaceAzimuth(270), 90)
  assert.equal(compassToSurfaceAzimuth(0), -180)
})

test('transpose: tilted south beats flat and north in N hemisphere', () => {
  const p = buildIrradianceProfile(51.5, 1000)
  const south = transpose(51.5, p.monthlyDailyGHI, 35, 180, 0.2).annualPOA
  const north = transpose(51.5, p.monthlyDailyGHI, 35, 0, 0.2).annualPOA
  const flat = transpose(51.5, p.monthlyDailyGHI, 0, 180, 0.2).annualPOA
  assert.ok(south > flat)
  assert.ok(south > north * 1.3)
  assert.ok(transpose(51.5, p.monthlyDailyGHI, 35, 180, 0.2).factor > 1)
})

test('transpose preserves the annual GHI total and returns 12 months', () => {
  const p = buildIrradianceProfile(40, 1700)
  const t = transpose(40, p.monthlyDailyGHI, 30, 180, 0.2)
  assert.equal(t.monthlyPOA.length, 12)
  assert.ok(Math.abs(t.annualGHI - 1700) < 5)
})

test('optimal orientation faces the equator with tilt near latitude', () => {
  const pN = buildIrradianceProfile(51.5, 1000)
  const optN = findOptimalOrientation(51.5, pN.monthlyDailyGHI, 0.2)
  assert.equal(optN.azimuthDeg, 180)
  assert.ok(Math.abs(optN.tiltDeg - 51.5) < 20)

  const pS = buildIrradianceProfile(-33.9, 2000)
  const optS = findOptimalOrientation(-33.9, pS.monthlyDailyGHI, 0.2)
  assert.ok(optS.azimuthDeg === 0 || optS.azimuthDeg >= 350)
})

test('no NaN at extreme latitude / vertical tilt', () => {
  const p = buildIrradianceProfile(78, 700)
  const t = transpose(78, p.monthlyDailyGHI, 90, 180, 0.2)
  assert.ok(Number.isFinite(t.annualPOA))
  assert.ok(t.monthlyPOA.every(Number.isFinite))
})
