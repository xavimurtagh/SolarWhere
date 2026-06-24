/** CSV report generation & download for a calculator assessment. */

import type { AssessmentResult } from '../../lib/solar/types'
import { type CalculatorState, effectiveAnnualKWh } from '../../lib/scenario'
import { findRegion } from '../../lib/data/regions'

function cell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function round(n: number, d = 0): number {
  if (!isFinite(n)) return 0
  const f = Math.pow(10, d)
  return Math.round(n * f) / f
}

export function buildReportCsv(state: CalculatorState, result: AssessmentResult): string {
  const r = result
  const cur = r.finance.currency
  const region = findRegion(state.regionId)
  const summary: [string, string | number][] = [
    ['SolarWhere report', ''],
    ['Location', region.name],
    ['Mounting surface', state.surfaceType],
    ['Tilt (deg)', state.tiltDeg],
    ['Azimuth (deg)', state.azimuthDeg],
    ['Shading (%)', state.shadingPct],
    ['Panel', state.panelId],
    ['System size (kWp)', round(r.sizing.systemSizeKWp, 2)],
    ['Panels', r.sizing.panelCount],
    ['Battery (kWh)', state.batteryKWh],
    ['Annual consumption (kWh)', round(effectiveAnnualKWh(state))],
    ['Annual generation (kWh)', round(r.generation.annualGenerationKWh)],
    ['Specific yield (kWh/kWp)', round(r.generation.specificYield)],
    ['Performance ratio', round(r.generation.performanceRatio.total, 3)],
    ['Self-consumption (%)', round(r.energyFlow.selfConsumptionFraction * 100)],
    ['Self-sufficiency (%)', round(r.energyFlow.selfSufficiencyFraction * 100)],
    [`Gross cost (${cur})`, round(r.finance.grossCapex)],
    [`Incentive (${cur})`, round(r.finance.subsidyApplied)],
    [`Net cost (${cur})`, round(r.finance.netCapex)],
    [`Year-1 savings (${cur})`, round(r.finance.year1Savings)],
    ['Payback (yr)', isFinite(r.finance.paybackYears) ? round(r.finance.paybackYears, 1) : 'never'],
    ['IRR (%)', isFinite(r.finance.irr) ? round(r.finance.irr * 100, 1) : 'n/a'],
    [`NPV (${cur})`, round(r.finance.npv)],
    [`LCOE (${cur}/kWh)`, round(r.finance.lcoe, 3)],
    [`Lifetime savings (${cur})`, round(r.finance.lifetimeSavings)],
    ['Lifetime CO2 avoided (kg)', round(r.environment.lifetimeCO2Kg)],
  ]

  const lines: string[] = []
  for (const [k, v] of summary) lines.push(`${cell(k)},${cell(v)}`)
  lines.push('')
  lines.push(['Year', 'Generation (kWh)', `Savings (${cur})`, `Costs (${cur})`, `Net (${cur})`, `Cumulative (${cur})`].map(cell).join(','))
  for (const c of r.finance.cashflow) {
    lines.push([c.year, round(c.generationKWh), round(c.savings), round(c.costs), round(c.net), round(c.cumulative)].map(cell).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(csv: string, filename: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
