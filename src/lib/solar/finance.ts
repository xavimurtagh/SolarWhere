/**
 * Financial appraisal: cashflow, payback, NPV, IRR, ROI and LCOE.
 *
 * Each year the system saves money by (a) offsetting imported electricity with
 * self-consumed solar and (b) earning export revenue. Costs are O&M and a
 * mid-life inverter replacement. Electricity prices escalate annually.
 */

import type {
  CashflowYear,
  FinanceParams,
  FinanceResult,
  Tariff,
} from './types'

export interface FinanceInput {
  currency: string
  grossCapex: number
  subsidyFraction: number
  subsidyFixed: number
  /** Per-year generation (after degradation), kWh. Length = analysisYears. */
  yearlyGenerationKWh: number[]
  /** Year-1 self-consumed fraction of generation (held constant). */
  selfConsumedFraction: number
  /** Year-1 exported fraction of generation (held constant). */
  exportedFraction: number
  tariff: Tariff
  finance: FinanceParams
  inverterReplacementCost: number
  inverterReplacementYear: number
}

export function computeFinance(p: FinanceInput): FinanceResult {
  const subsidyApplied = Math.min(
    p.grossCapex,
    p.grossCapex * p.subsidyFraction + p.subsidyFixed,
  )
  const netCapex = Math.max(0, p.grossCapex - subsidyApplied)
  const omAnnualBase = p.grossCapex * p.finance.omFractionPerYear
  const infl = p.tariff.priceInflationPerYear
  const disc = p.finance.discountRatePerYear

  const cashflow: CashflowYear[] = []
  // Year 0 — the investment.
  cashflow.push({
    year: 0,
    generationKWh: 0,
    savings: 0,
    costs: netCapex,
    net: -netCapex,
    cumulative: -netCapex,
    discountedNet: -netCapex,
  })

  let cumulative = -netCapex
  let year1Savings = 0
  let sumSavings = 0
  let sumCosts = 0
  let npv = -netCapex
  // For LCOE (discounted lifetime cost / discounted lifetime energy).
  let discountedCost = netCapex
  let discountedEnergy = 0

  p.yearlyGenerationKWh.forEach((gen, idx) => {
    const year = idx + 1
    const importPrice = p.tariff.importPrice * Math.pow(1 + infl, idx)
    const exportPrice = p.tariff.exportPrice * Math.pow(1 + infl, idx)
    const selfConsumed = gen * p.selfConsumedFraction
    const exported = gen * p.exportedFraction
    const savings = selfConsumed * importPrice + exported * exportPrice

    let costs = omAnnualBase * Math.pow(1 + infl, idx)
    if (year === p.inverterReplacementYear) costs += p.inverterReplacementCost

    const net = savings - costs
    cumulative += net
    const discountFactor = Math.pow(1 + disc, year)
    const discountedNet = net / discountFactor

    if (year === 1) year1Savings = savings
    sumSavings += savings
    sumCosts += costs
    npv += discountedNet
    discountedCost += costs / discountFactor
    discountedEnergy += gen / discountFactor

    cashflow.push({
      year,
      generationKWh: gen,
      savings,
      costs,
      net,
      cumulative,
      discountedNet,
    })
  })

  const paybackYears = computePayback(cashflow)
  const irr = computeIRR(cashflow.map((c) => c.net))
  const lcoe = discountedEnergy > 0 ? discountedCost / discountedEnergy : Infinity
  const lifetimeSavings = sumSavings - sumCosts
  const roi = netCapex > 0 ? (lifetimeSavings - netCapex) / netCapex : 0

  return {
    currency: p.currency,
    grossCapex: p.grossCapex,
    netCapex,
    subsidyApplied,
    year1Savings,
    paybackYears,
    npv,
    irr,
    lcoe,
    lifetimeSavings,
    roi,
    cashflow,
  }
}

/** Linear-interpolated simple payback from the cumulative cashflow. */
function computePayback(cashflow: CashflowYear[]): number {
  for (let i = 1; i < cashflow.length; i++) {
    const prev = cashflow[i - 1]
    const cur = cashflow[i]
    if (cur.cumulative >= 0 && prev.cumulative < 0) {
      const frac = -prev.cumulative / (cur.cumulative - prev.cumulative)
      return prev.year + frac
    }
  }
  return Infinity
}

/** Internal rate of return via bisection on NPV(rate) = 0. */
function computeIRR(netByYear: number[]): number {
  const npvAt = (rate: number) =>
    netByYear.reduce((acc, cf, year) => acc + cf / Math.pow(1 + rate, year), 0)

  let lo = -0.9
  let hi = 2.0
  const fLo = npvAt(lo)
  const fHi = npvAt(hi)
  if (fLo * fHi > 0) return NaN // no sign change → undefined
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const fMid = npvAt(mid)
    if (Math.abs(fMid) < 1e-6) return mid
    if (fLo * fMid < 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}
