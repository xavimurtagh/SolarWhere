/**
 * Solar geometry & irradiance transposition.
 *
 * Implements a physically-grounded model to convert global horizontal
 * irradiation (GHI) into plane-of-array (POA) irradiation for an arbitrary
 * tilt and azimuth at any latitude:
 *
 *   1. Decompose monthly GHI into beam + diffuse via the monthly Erbs
 *      correlation (using the clearness index KT = H / H0).
 *   2. Transpose beam to the tilted plane with a numerically-integrated
 *      beam tilt factor Rb (Duffie & Beckman angle-of-incidence formula).
 *   3. Add isotropic sky diffuse and ground-reflected components
 *      (Liu & Jordan isotropic model).
 *
 * References: Duffie & Beckman, "Solar Engineering of Thermal Processes".
 */

const SOLAR_CONSTANT = 1361 // W/m², modern value
const DEG = Math.PI / 180

export const toRad = (d: number) => d * DEG
export const toDeg = (r: number) => r / DEG
export const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x))

/** Representative ("average") day-of-year for each month (Klein 1977). */
export const REP_DAY_OF_YEAR = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344]
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Solar declination (radians) for day-of-year n (Cooper's equation). */
export function declination(n: number): number {
  return toRad(23.45) * Math.sin((2 * Math.PI * (284 + n)) / 365)
}

/** Sunset hour angle (radians) for a latitude/declination. */
export function sunsetHourAngle(latRad: number, decRad: number): number {
  const cosW = clamp(-Math.tan(latRad) * Math.tan(decRad), -1, 1)
  return Math.acos(cosW)
}

/**
 * Extraterrestrial daily insolation on a horizontal surface (kWh/m²/day)
 * for day-of-year n at a given latitude.
 */
export function extraterrestrialDaily(n: number, latRad: number): number {
  const dec = declination(n)
  const ws = sunsetHourAngle(latRad, dec)
  const eccentricity = 1 + 0.033 * Math.cos((2 * Math.PI * n) / 365)
  // Joules per m² per day:
  const H0 =
    ((24 * 3600) / Math.PI) *
    SOLAR_CONSTANT *
    eccentricity *
    (Math.cos(latRad) * Math.cos(dec) * Math.sin(ws) +
      ws * Math.sin(latRad) * Math.sin(dec))
  return Math.max(0, H0) / 3_600_000 // → kWh/m²/day
}

/**
 * Monthly diffuse fraction from the daily clearness index KT (Erbs monthly
 * correlation). `sunsetDeg` is the sunset hour angle in degrees.
 */
export function erbsDiffuseFraction(KT: number, sunsetDeg: number): number {
  const kt = clamp(KT, 0.05, 0.85)
  let f: number
  if (sunsetDeg <= 81.4) {
    f = 1.391 - 3.56 * kt + 4.189 * kt * kt - 2.137 * kt * kt * kt
  } else {
    f = 1.311 - 3.022 * kt + 3.427 * kt * kt - 1.821 * kt * kt * kt
  }
  return clamp(f, 0.05, 1)
}

/**
 * Convert compass azimuth (0=N,90=E,180=S,270=W) to the Duffie & Beckman
 * surface azimuth (0 = due south, east negative, west positive).
 */
export function compassToSurfaceAzimuth(compassDeg: number): number {
  let g = compassDeg - 180
  if (g > 180) g -= 360
  if (g < -180) g += 360
  return g
}

/**
 * cos(angle of incidence) on a tilted plane (Duffie & Beckman, eq. 1.6.2).
 * All angles in radians; `gamma` is the surface azimuth (0 = due south).
 */
function cosIncidence(
  latRad: number,
  decRad: number,
  tiltRad: number,
  gammaRad: number,
  omegaRad: number,
): number {
  const sinDec = Math.sin(decRad)
  const cosDec = Math.cos(decRad)
  const sinLat = Math.sin(latRad)
  const cosLat = Math.cos(latRad)
  const sinTilt = Math.sin(tiltRad)
  const cosTilt = Math.cos(tiltRad)
  const cosGamma = Math.cos(gammaRad)
  const sinGamma = Math.sin(gammaRad)
  const cosW = Math.cos(omegaRad)
  const sinW = Math.sin(omegaRad)

  return (
    sinDec * sinLat * cosTilt -
    sinDec * cosLat * sinTilt * cosGamma +
    cosDec * cosLat * cosTilt * cosW +
    cosDec * sinLat * sinTilt * cosGamma * cosW +
    cosDec * sinTilt * sinGamma * sinW
  )
}

/**
 * Numerically-integrated beam tilt factor Rb = Σcosθ / Σcosθz over a day,
 * for the representative day of the given declination.
 */
function beamTiltFactor(
  latRad: number,
  decRad: number,
  tiltRad: number,
  gammaRad: number,
): number {
  const ws = sunsetHourAngle(latRad, decRad)
  if (ws <= 1e-6) return 0
  const step = toRad(2.5) // ~10-minute integration step
  let sumCosTheta = 0
  let sumCosZenith = 0
  for (let omega = -ws; omega <= ws + 1e-9; omega += step) {
    const cosZ =
      Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(omega)
    if (cosZ <= 0) continue
    const cosTheta = cosIncidence(latRad, decRad, tiltRad, gammaRad, omega)
    sumCosZenith += cosZ
    if (cosTheta > 0) sumCosTheta += cosTheta
  }
  if (sumCosZenith <= 0) return 0
  return sumCosTheta / sumCosZenith
}

export interface TranspositionResult {
  /** Per-month POA totals, kWh/m²/month. */
  monthlyPOA: number[]
  /** Annual POA total, kWh/m²/year. */
  annualPOA: number
  /** Annual GHI implied by the monthly profile, kWh/m²/year. */
  annualGHI: number
  /** POA / GHI transposition factor. */
  factor: number
}

/**
 * Transpose a monthly daily-average GHI profile (kWh/m²/day, length 12) to
 * the plane of array for the given tilt/azimuth at a signed latitude.
 */
export function transpose(
  latDeg: number,
  monthlyDailyGHI: number[],
  tiltDeg: number,
  azimuthCompassDeg: number,
  albedo: number,
): TranspositionResult {
  const latRad = toRad(latDeg)
  const tiltRad = toRad(tiltDeg)
  const gammaRad = toRad(compassToSurfaceAzimuth(azimuthCompassDeg))
  const cosTiltTerm = (1 + Math.cos(tiltRad)) / 2
  const reflTerm = (albedo * (1 - Math.cos(tiltRad))) / 2

  const monthlyPOA: number[] = []
  let annualPOA = 0
  let annualGHI = 0

  for (let m = 0; m < 12; m++) {
    const n = REP_DAY_OF_YEAR[m]
    const dec = declination(n)
    const H = monthlyDailyGHI[m] // kWh/m²/day
    const H0 = extraterrestrialDaily(n, latRad)
    const ws = sunsetHourAngle(latRad, dec)
    const KT = H0 > 0 ? H / H0 : 0
    const diffuseFrac = erbsDiffuseFraction(KT, toDeg(ws))
    const Hd = H * diffuseFrac
    const Hb = Math.max(0, H - Hd)
    const Rb = beamTiltFactor(latRad, dec, tiltRad, gammaRad)

    const poaDaily = Hb * Rb + Hd * cosTiltTerm + H * reflTerm
    const monthTotal = poaDaily * DAYS_IN_MONTH[m]
    monthlyPOA.push(monthTotal)
    annualPOA += monthTotal
    annualGHI += H * DAYS_IN_MONTH[m]
  }

  return {
    monthlyPOA,
    annualPOA,
    annualGHI,
    factor: annualGHI > 0 ? annualPOA / annualGHI : 0,
  }
}

/**
 * Search for the tilt/azimuth that maximises annual POA at a location.
 * Azimuth search is constrained near the equator-facing direction.
 */
export function findOptimalOrientation(
  latDeg: number,
  monthlyDailyGHI: number[],
  albedo: number,
): { tiltDeg: number; azimuthDeg: number; annualPOA: number } {
  const equatorAzimuth = latDeg >= 0 ? 180 : 0
  let best = { tiltDeg: 0, azimuthDeg: equatorAzimuth, annualPOA: -1 }
  for (let tilt = 0; tilt <= 70; tilt += 1) {
    for (let dAz = -60; dAz <= 60; dAz += 5) {
      const az = (equatorAzimuth + dAz + 360) % 360
      const { annualPOA } = transpose(latDeg, monthlyDailyGHI, tilt, az, albedo)
      if (annualPOA > best.annualPOA) {
        best = { tiltDeg: tilt, azimuthDeg: az, annualPOA }
      }
    }
  }
  return best
}
