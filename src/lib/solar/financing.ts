/**
 * Financing comparison: paying cash vs. taking a loan.
 *
 * Most households and businesses don't pay cash — they finance. This module
 * compares the two so a user can see the up-front-vs-monthly trade-off and
 * whether solar is cashflow-positive from day one under a loan.
 */

/** Level monthly payment on an amortizing loan. */
export function monthlyLoanPayment(
  principal: number,
  aprPerYear: number,
  termYears: number,
): number {
  if (principal <= 0) return 0
  const n = Math.round(termYears * 12)
  if (n <= 0) return principal
  const i = aprPerYear / 12
  if (i === 0) return principal / n
  return (principal * i) / (1 - Math.pow(1 + i, -n))
}

export interface LoanTerms {
  /** Annual percentage rate, fraction (e.g. 0.06). */
  aprPerYear: number
  /** Loan term, years. */
  termYears: number
  /** Down-payment as a fraction of net capex (0–1). */
  downFraction: number
}

export interface FinancingResult {
  /** Cumulative position by year if paying cash (year 0 = −netCapex). */
  cashCumulative: number[]
  loan: {
    downPayment: number
    principal: number
    monthlyPayment: number
    annualPayment: number
    totalPaid: number
    totalInterest: number
    /** Cumulative position by year under the loan. */
    cumulative: number[]
    /** Year the loan position first turns positive (Infinity if never). */
    breakevenYear: number
    /** Year-1 monthly: solar saving, loan payment and their net. */
    year1MonthlySaving: number
    year1MonthlyPayment: number
    year1NetMonthly: number
  }
}

/**
 * @param netCapex     up-front system cost after incentives
 * @param savingsByYear per-year net savings (savings − O&M), length = horizon
 * @param terms        loan terms
 */
export function compareFinancing(
  netCapex: number,
  savingsByYear: number[],
  terms: LoanTerms,
): FinancingResult {
  const downPayment = netCapex * clamp01(terms.downFraction)
  const principal = Math.max(0, netCapex - downPayment)
  const monthlyPayment = monthlyLoanPayment(principal, terms.aprPerYear, terms.termYears)
  const annualPayment = monthlyPayment * 12
  const totalPaid = downPayment + annualPayment * terms.termYears
  const totalInterest = Math.max(0, totalPaid - netCapex)

  const cashCumulative: number[] = [-netCapex]
  const loanCumulative: number[] = [-downPayment]
  let cash = -netCapex
  let loan = -downPayment
  savingsByYear.forEach((saving, idx) => {
    const year = idx + 1
    cash += saving
    cashCumulative.push(cash)
    const debt = year <= terms.termYears ? annualPayment : 0
    loan += saving - debt
    loanCumulative.push(loan)
  })

  const breakevenYear = interpCrossZero(loanCumulative)
  const year1Saving = savingsByYear[0] ?? 0

  return {
    cashCumulative,
    loan: {
      downPayment,
      principal,
      monthlyPayment,
      annualPayment,
      totalPaid,
      totalInterest,
      cumulative: loanCumulative,
      breakevenYear,
      year1MonthlySaving: year1Saving / 12,
      year1MonthlyPayment: monthlyPayment,
      year1NetMonthly: year1Saving / 12 - monthlyPayment,
    },
  }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/** First index where a cumulative series crosses from negative to ≥0 (interpolated). */
function interpCrossZero(series: number[]): number {
  for (let i = 1; i < series.length; i++) {
    if (series[i] >= 0 && series[i - 1] < 0) {
      const frac = -series[i - 1] / (series[i] - series[i - 1])
      return i - 1 + frac
    }
  }
  return series[0] >= 0 ? 0 : Infinity
}
