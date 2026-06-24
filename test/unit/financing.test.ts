import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareFinancing, monthlyLoanPayment } from '../../src/lib/solar/financing.ts'

test('monthly payment edge cases', () => {
  assert.equal(monthlyLoanPayment(0, 0.06, 10), 0)
  // 0% APR → straight-line
  assert.ok(Math.abs(monthlyLoanPayment(12000, 0, 10) - 100) < 1e-9)
  // positive APR costs more than straight-line
  assert.ok(monthlyLoanPayment(12000, 0.06, 10) > 100)
})

test('compareFinancing splits principal and accrues interest', () => {
  const savings = Array(25).fill(1500)
  const r = compareFinancing(10000, savings, { aprPerYear: 0.06, termYears: 10, downFraction: 0.1 })
  assert.ok(Math.abs(r.loan.downPayment - 1000) < 1e-6)
  assert.ok(Math.abs(r.loan.principal - 9000) < 1e-6)
  assert.ok(r.loan.totalInterest > 0)
  assert.ok(r.loan.totalPaid > 10000)
})

test('cumulative series start at the up-front outlay', () => {
  const savings = Array(25).fill(1500)
  const r = compareFinancing(10000, savings, { aprPerYear: 0.06, termYears: 10, downFraction: 0.2 })
  assert.ok(Math.abs(r.cashCumulative[0] + 10000) < 1e-6)
  assert.ok(Math.abs(r.loan.cumulative[0] + 2000) < 1e-6) // -down payment
})

test('net monthly = saving/12 − payment', () => {
  const savings = Array(25).fill(2400) // $200/mo saving
  const r = compareFinancing(10000, savings, { aprPerYear: 0, termYears: 10, downFraction: 0 })
  // 0% APR, 10yr on 10000 → $83.3/mo payment; net ≈ 200 - 83.3 > 0
  assert.ok(Math.abs(r.loan.year1MonthlySaving - 200) < 1e-6)
  assert.ok(r.loan.year1NetMonthly > 0)
})

test('breakeven is finite when savings outpace debt', () => {
  const savings = Array(25).fill(3000)
  const r = compareFinancing(10000, savings, { aprPerYear: 0.05, termYears: 8, downFraction: 0.1 })
  assert.ok(isFinite(r.loan.breakevenYear))
})
