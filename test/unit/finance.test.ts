import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeFinance, type FinanceInput } from '../../src/lib/solar/finance.ts'
import type { FinanceParams, Tariff } from '../../src/lib/solar/types.ts'

const tariff: Tariff = {
  currency: '$',
  importPrice: 0.3,
  exportPrice: 0.1,
  priceInflationPerYear: 0.03,
}
const finance: FinanceParams = {
  discountRatePerYear: 0.05,
  analysisYears: 25,
  upfrontSubsidyFraction: 0,
  upfrontSubsidyFixed: 0,
  omFractionPerYear: 0.01,
}

function input(overrides: Partial<FinanceInput> = {}): FinanceInput {
  return {
    currency: '$',
    grossCapex: 10000,
    subsidyFraction: 0,
    subsidyFixed: 0,
    yearlyGenerationKWh: Array.from({ length: 25 }, (_, y) => 5000 * Math.pow(0.995, y)),
    selfConsumedFraction: 0.5,
    exportedFraction: 0.5,
    tariff,
    finance,
    inverterReplacementCost: 1000,
    inverterReplacementYear: 13,
    ...overrides,
  }
}

test('year 0 cashflow is the negative net capex', () => {
  const r = computeFinance(input())
  assert.equal(r.cashflow[0].year, 0)
  assert.ok(Math.abs(r.cashflow[0].net + r.netCapex) < 1e-6)
})

test('subsidy reduces net capex', () => {
  const r = computeFinance(input({ subsidyFraction: 0.3 }))
  assert.ok(Math.abs(r.subsidyApplied - 3000) < 1e-6)
  assert.ok(Math.abs(r.netCapex - 7000) < 1e-6)
})

test('payback finite with savings, infinite with none', () => {
  const ok = computeFinance(input())
  assert.ok(isFinite(ok.paybackYears) && ok.paybackYears > 0)
  const never = computeFinance(input({ yearlyGenerationKWh: Array(25).fill(1), grossCapex: 1e7 }))
  assert.equal(never.paybackYears, Infinity)
})

test('NPV decreases as the discount rate increases', () => {
  const low = computeFinance(input({ finance: { ...finance, discountRatePerYear: 0.02 } }))
  const high = computeFinance(input({ finance: { ...finance, discountRatePerYear: 0.1 } }))
  assert.ok(low.npv > high.npv)
})

test('IRR is positive for a profitable project and LCOE is positive', () => {
  const r = computeFinance(input())
  assert.ok(r.irr > 0 && r.irr < 1)
  assert.ok(r.lcoe > 0 && r.lcoe < 1)
})

test('zero capex does not divide by zero', () => {
  const r = computeFinance(input({ grossCapex: 0 }))
  assert.equal(r.netCapex, 0)
  assert.ok(Number.isFinite(r.npv))
  assert.equal(r.roi, 0)
})

test('cashflow has horizon + 1 entries (year 0..N)', () => {
  const r = computeFinance(input())
  assert.equal(r.cashflow.length, 26)
})
