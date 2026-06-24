import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReportCsv } from '../../src/features/calculator/report.ts'
import { defaultState, stateToBuildParams } from '../../src/lib/scenario.ts'
import { runAssessment } from '../../src/lib/assess.ts'

test('buildReportCsv produces a summary + cashflow table', () => {
  const state = defaultState()
  const result = runAssessment(stateToBuildParams(state))
  const csv = buildReportCsv(state, result)
  const lines = csv.split('\n')

  assert.ok(csv.includes('SolarWhere report'))
  assert.ok(csv.includes('System size (kWp)'))
  assert.ok(csv.includes('Year,Generation (kWh)')) // cashflow header
  // Summary + blank + header + 26 cashflow rows (year 0..25).
  assert.ok(lines.length > 30)
})

test('CSV escapes fields containing commas (e.g. "Phoenix, AZ")', () => {
  const state = defaultState()
  state.regionId = 'us-phoenix'
  const result = runAssessment(stateToBuildParams(state))
  const csv = buildReportCsv(state, result)
  assert.ok(csv.includes('"Phoenix, AZ"'))
})

test('handles a never-pays-back scenario without throwing', () => {
  const state = defaultState()
  state.importPrice = 0.001
  state.exportPrice = 0
  const result = runAssessment(stateToBuildParams(state))
  assert.doesNotThrow(() => buildReportCsv(state, result))
  assert.ok(buildReportCsv(state, result).includes('never'))
})
