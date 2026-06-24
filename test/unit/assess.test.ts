import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runAssessment } from '../../src/lib/assess.ts'
import { REGIONS, findRegion } from '../../src/lib/data/regions.ts'
import { PANELS } from '../../src/lib/data/panels.ts'
import { SURFACE_TYPES } from '../../src/lib/solar/system.ts'

test('full pipeline holds invariants across many input combinations', () => {
  let count = 0
  for (const region of REGIONS) {
    for (const surface of SURFACE_TYPES) {
      for (const battery of [0, 10]) {
        const r = runAssessment({
          region,
          surfaceType: surface.type,
          areaM2: 80,
          orientation: { tiltDeg: surface.defaultTilt, azimuthDeg: region.lat >= 0 ? 180 : 0 },
          shadingFraction: 0.1,
          panel: PANELS[count % PANELS.length],
          consumption: { annualKWh: 5000, daytimeFraction: 0.35 },
          batteryKWh: battery,
        })
        count++

        // No NaN/undefined in key outputs.
        for (const v of [
          r.sizing.systemSizeKWp,
          r.generation.annualGenerationKWh,
          r.generation.specificYield,
          r.finance.netCapex,
          r.finance.npv,
          r.environment.lifetimeCO2Kg,
        ]) {
          assert.ok(Number.isFinite(v), `non-finite value in ${region.id}/${surface.type}`)
        }

        // Fractions bounded.
        assert.ok(r.energyFlow.selfConsumptionFraction >= 0 && r.energyFlow.selfConsumptionFraction <= 1.0001)
        assert.ok(r.energyFlow.selfSufficiencyFraction >= 0 && r.energyFlow.selfSufficiencyFraction <= 1.0001)
        assert.ok(r.orientationEfficiency > 0 && r.orientationEfficiency <= 1.0001)

        // Energy conservation.
        assert.ok(
          r.energyFlow.selfConsumedKWh + r.energyFlow.exportedKWh <= r.generation.annualGenerationKWh + 1e-6,
        )

        // Payback non-negative or Infinity; specific yield sane.
        assert.ok(r.finance.paybackYears > 0)
        assert.ok(r.generation.specificYield > 200 && r.generation.specificYield < 2500)
      }
    }
  }
  assert.ok(count > 100)
})

test('sunnier climates yield more per kWp than cloudy ones', () => {
  const phx = runAssessment(baseFor('us-phoenix'))
  const ldn = runAssessment(baseFor('uk-london'))
  assert.ok(phx.generation.specificYield > ldn.generation.specificYield)
})

test('battery raises self-sufficiency vs no battery', () => {
  const none = runAssessment({ ...baseFor('uk-london'), batteryKWh: 0 })
  const batt = runAssessment({ ...baseFor('uk-london'), batteryKWh: 10 })
  assert.ok(batt.energyFlow.selfSufficiencyFraction >= none.energyFlow.selfSufficiencyFraction)
})

function baseFor(regionId: string) {
  const region = findRegion(regionId)
  return {
    region,
    surfaceType: 'roof-pitched' as const,
    systemSizeKWp: 5,
    orientation: { tiltDeg: 35, azimuthDeg: region.lat >= 0 ? 180 : 0 },
    shadingFraction: 0.05,
    panel: PANELS[1],
    consumption: { annualKWh: 4500, daytimeFraction: 0.3 },
    batteryKWh: 0,
  }
}
