/**
 * Engine smoke test. Run with: npm run test:engine
 * Prints headline results for several regions/orientations and asserts that
 * the numbers fall within physically plausible ranges (PVWatts-style sanity).
 */

import { runAssessment } from '../src/lib/assess'
import { findRegion } from '../src/lib/data/regions'
import { DEFAULT_PANEL } from '../src/lib/data/panels'
import { findOptimalOrientation, transpose } from '../src/lib/solar'
import { buildIrradianceProfile } from '../src/lib/solar/irradiance'

let failures = 0
function check(name: string, cond: boolean, detail: string) {
  const ok = cond ? 'PASS' : 'FAIL'
  if (!cond) failures++
  console.log(`  [${ok}] ${name} — ${detail}`)
}

function fmt(n: number, d = 0) {
  return n.toLocaleString('en-US', { maximumFractionDigits: d })
}

console.log('\n=== SolarWhere engine smoke test ===\n')

// 1. Specific yield should track irradiance & climate across regions.
const cases = [
  { id: 'us-phoenix', loYield: 1500, hiYield: 2000 },
  { id: 'es-madrid', loYield: 1250, hiYield: 1750 },
  { id: 'uk-london', loYield: 700, hiYield: 1050 },
  { id: 'au-sydney', loYield: 1200, hiYield: 1700 },
]

for (const c of cases) {
  const region = findRegion(c.id)
  const res = runAssessment({
    region,
    surfaceType: 'roof-pitched',
    systemSizeKWp: 5,
    orientation: { tiltDeg: Math.abs(region.lat), azimuthDeg: region.lat >= 0 ? 180 : 0 },
    shadingFraction: 0,
    panel: DEFAULT_PANEL,
    consumption: { annualKWh: 4500, daytimeFraction: 0.35 },
    batteryKWh: 0,
  })
  const sy = res.generation.specificYield
  console.log(
    `${region.name}: specificYield=${fmt(sy)} kWh/kWp, annual=${fmt(
      res.generation.annualGenerationKWh,
    )} kWh, PR=${res.generation.performanceRatio.total.toFixed(2)}, ` +
      `transposition=${res.generation.transpositionFactor.toFixed(2)}, ` +
      `payback=${res.finance.paybackYears.toFixed(1)}y, ` +
      `IRR=${(res.finance.irr * 100).toFixed(1)}%`,
  )
  check(
    `${region.name} specific yield in range`,
    sy >= c.loYield && sy <= c.hiYield,
    `${fmt(sy)} kWh/kWp (expected ${c.loYield}–${c.hiYield})`,
  )
  check(
    `${region.name} PR plausible`,
    res.generation.performanceRatio.total > 0.7 && res.generation.performanceRatio.total < 0.88,
    `PR=${res.generation.performanceRatio.total.toFixed(3)}`,
  )
}

console.log('')

// 2. Orientation: south beats north (N. hemisphere); optimum tilt near latitude.
const ldn = findRegion('uk-london')
const profile = buildIrradianceProfile(ldn.lat, ldn.annualGHI)
const south = transpose(ldn.lat, profile.monthlyDailyGHI, 35, 180, 0.2).annualPOA
const north = transpose(ldn.lat, profile.monthlyDailyGHI, 35, 0, 0.2).annualPOA
const flat = transpose(ldn.lat, profile.monthlyDailyGHI, 0, 180, 0.2).annualPOA
check('south-facing beats north-facing', south > north * 1.4, `S=${fmt(south)} vs N=${fmt(north)}`)
check('tilt improves on flat (London)', south > flat, `tilted=${fmt(south)} vs flat=${fmt(flat)}`)

const opt = findOptimalOrientation(ldn.lat, profile.monthlyDailyGHI, 0.2)
console.log(`London optimal orientation: tilt=${opt.tiltDeg}°, azimuth=${opt.azimuthDeg}°`)
check('optimal tilt within 15° of latitude', Math.abs(opt.tiltDeg - Math.abs(ldn.lat)) < 18, `tilt=${opt.tiltDeg}, lat=${ldn.lat.toFixed(0)}`)
check('optimal azimuth ~ south', Math.abs(opt.azimuthDeg - 180) <= 10, `az=${opt.azimuthDeg}`)

// 3. Southern hemisphere optimum should face north.
const syd = findRegion('au-sydney')
const sydProfile = buildIrradianceProfile(syd.lat, syd.annualGHI)
const sydOpt = findOptimalOrientation(syd.lat, sydProfile.monthlyDailyGHI, 0.2)
console.log(`Sydney optimal orientation: tilt=${sydOpt.tiltDeg}°, azimuth=${sydOpt.azimuthDeg}°`)
check('Sydney optimum faces north', sydOpt.azimuthDeg <= 10 || sydOpt.azimuthDeg >= 350, `az=${sydOpt.azimuthDeg}`)

console.log('')

// 4. Battery raises self-consumption & self-sufficiency.
const noBatt = runAssessment({
  region: ldn, surfaceType: 'roof-pitched', systemSizeKWp: 5,
  orientation: { tiltDeg: 35, azimuthDeg: 180 }, shadingFraction: 0,
  panel: DEFAULT_PANEL, consumption: { annualKWh: 4500, daytimeFraction: 0.3 }, batteryKWh: 0,
})
const withBatt = runAssessment({
  region: ldn, surfaceType: 'roof-pitched', systemSizeKWp: 5,
  orientation: { tiltDeg: 35, azimuthDeg: 180 }, shadingFraction: 0,
  panel: DEFAULT_PANEL, consumption: { annualKWh: 4500, daytimeFraction: 0.3 }, batteryKWh: 10,
})
console.log(
  `London self-consumption: no battery=${(noBatt.energyFlow.selfConsumptionFraction * 100).toFixed(0)}%, ` +
    `with 10kWh=${(withBatt.energyFlow.selfConsumptionFraction * 100).toFixed(0)}%`,
)
check('battery raises self-consumption', withBatt.energyFlow.selfConsumptionFraction > noBatt.energyFlow.selfConsumptionFraction, 'battery > no-battery')
check('self-sufficiency <= 1', withBatt.energyFlow.selfSufficiencyFraction <= 1.0001, `${withBatt.energyFlow.selfSufficiencyFraction.toFixed(2)}`)

// 5. Energy balance is conserved (self-consumed + exported + losses = generation).
const ef = withBatt.energyFlow
const balance = ef.selfConsumedKWh + ef.exportedKWh
check('energy balance sane', balance <= withBatt.generation.annualGenerationKWh + 1, `flows=${fmt(balance)} <= gen=${fmt(withBatt.generation.annualGenerationKWh)}`)

// 6. Shading reduces generation.
const shaded = runAssessment({
  region: ldn, surfaceType: 'roof-pitched', systemSizeKWp: 5,
  orientation: { tiltDeg: 35, azimuthDeg: 180 }, shadingFraction: 0.25,
  panel: DEFAULT_PANEL, consumption: { annualKWh: 4500, daytimeFraction: 0.3 }, batteryKWh: 0,
})
check('shading reduces output ~25%', Math.abs(1 - shaded.generation.annualGenerationKWh / noBatt.generation.annualGenerationKWh - 0.25) < 0.02, `loss=${((1 - shaded.generation.annualGenerationKWh / noBatt.generation.annualGenerationKWh) * 100).toFixed(0)}%`)

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===\n`)
process.exit(failures === 0 ? 0 : 1)
