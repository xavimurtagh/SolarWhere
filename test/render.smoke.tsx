/**
 * Render smoke test: server-render the chart/logic-heavy feature components to
 * catch hook/render-time runtime errors that typechecking and bundling can't.
 * (Map components are excluded — they import Leaflet CSS which Node can't parse;
 * they are lazy-mounted in the UI anyway.)
 *
 * Run with: npx tsx test/render.smoke.tsx
 */
import React from 'react'
import { renderToString } from 'react-dom/server'
import Home from '../src/features/home/Home'
import BatteryAdvisor from '../src/features/battery/BatteryAdvisor'
import Optimizer from '../src/features/optimizer/Optimizer'
import EnterprisePlanner from '../src/features/enterprise/EnterprisePlanner'
import Guide from '../src/features/guide/Guide'
import Calculator from '../src/features/calculator/Calculator'
import { ResultsDashboard } from '../src/features/calculator/ResultsDashboard'
import { runAssessment } from '../src/lib/assess'
import { findRegion } from '../src/lib/data/regions'
import { DEFAULT_PANEL } from '../src/lib/data/panels'

// recharts uses ResizeObserver in effects (not during SSR), but guard anyway.
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let failures = 0
function tryRender(name: string, el: React.ReactElement) {
  try {
    const html = renderToString(el)
    const ok = html.length > 50
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name} rendered (${html.length} chars)`)
    if (!ok) failures++
  } catch (err) {
    failures++
    console.log(`  [FAIL] ${name} threw: ${(err as Error).message}`)
  }
}

console.log('\n=== SolarWhere render smoke test ===\n')
tryRender('Home', <Home onNavigate={() => {}} />)
tryRender('BatteryAdvisor', <BatteryAdvisor />)
tryRender('Optimizer', <Optimizer />)
tryRender('EnterprisePlanner', <EnterprisePlanner />)
tryRender('Guide', <Guide />)

const sampleResult = runAssessment({
  region: findRegion('us-losangeles'),
  surfaceType: 'roof-pitched',
  systemSizeKWp: 6,
  orientation: { tiltDeg: 30, azimuthDeg: 180 },
  shadingFraction: 0.08,
  panel: DEFAULT_PANEL,
  consumption: { annualKWh: 7000, daytimeFraction: 0.35 },
  batteryKWh: 10,
})
tryRender('ResultsDashboard', <ResultsDashboard result={sampleResult} />)
tryRender('Calculator', <Calculator />)

console.log(`\n=== ${failures === 0 ? 'ALL RENDERED' : failures + ' FAILED'} ===\n`)
process.exit(failures === 0 ? 0 : 1)
