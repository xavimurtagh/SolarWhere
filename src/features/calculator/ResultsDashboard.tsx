import type { AssessmentResult } from '../../lib/solar/types'
import type { FinancingResult } from '../../lib/solar/financing'
import {
  azimuthLabel,
  formatKWh,
  formatMoney,
  formatMoneyExact,
  formatNumber,
  formatPercent,
  formatTonnes,
  formatYears,
} from '../../lib/format'
import { Badge, Card, ProgressBar, SectionHeading, Stat } from '../../components/ui/primitives'
import {
  CashflowChart,
  Donut,
  DonutLegend,
  MonthlyGenerationChart,
  type DonutSlice,
} from '../../components/charts/Charts'

export function ResultsDashboard({
  result,
  financing,
  financingMode = 'cash',
}: {
  result: AssessmentResult
  financing?: FinancingResult
  financingMode?: 'cash' | 'loan'
}) {
  const { sizing, generation, energyFlow, finance, environment } = result
  const currency = finance.currency
  const monthlyConsumption = Array(12).fill(
    result.input.consumption.annualKWh / 12,
  )

  // Electricity bill: before vs after solar (net of export revenue).
  const billBeforeAnnual =
    result.input.consumption.annualKWh * result.input.tariff.importPrice
  const billAfterAnnual = Math.max(
    -billBeforeAnnual,
    energyFlow.gridImportKWh * result.input.tariff.importPrice -
      energyFlow.exportedKWh * result.input.tariff.exportPrice,
  )
  const billReduction =
    billBeforeAnnual > 0 ? 1 - billAfterAnnual / billBeforeAnnual : 0

  const genUse: DonutSlice[] = [
    { name: 'Self-consumed', value: energyFlow.selfConsumedKWh, color: 'green' },
    { name: 'Exported', value: energyFlow.exportedKWh, color: 'sky' },
  ]
  const loadSource: DonutSlice[] = [
    {
      name: 'From solar',
      value: result.input.consumption.annualKWh - energyFlow.gridImportKWh,
      color: 'solar',
    },
    { name: 'From grid', value: energyFlow.gridImportKWh, color: 'ink' },
  ]

  const pr = generation.performanceRatio
  const prRows = [
    { k: 'Temperature', v: pr.temperature },
    { k: 'Inverter', v: pr.inverter },
    { k: 'Soiling', v: pr.soiling },
    { k: 'Wiring & mismatch', v: pr.wiringMismatch },
    { k: 'Availability', v: pr.availability },
    { k: 'Light-induced (LID)', v: pr.lid },
  ]

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="System size" value={`${formatNumber(sizing.systemSizeKWp, 1)} kWp`} sub={`${sizing.panelCount} panels`} accent="solar" />
        <Stat label="Year-1 generation" value={formatKWh(generation.annualGenerationKWh)} sub={`${formatNumber(generation.specificYield)} kWh/kWp`} accent="sky" />
        <Stat label="Year-1 savings" value={formatMoney(finance.year1Savings, currency)} sub={`bill offset + export`} accent="green" />
        <Stat label="Payback" value={formatYears(finance.paybackYears)} sub={`IRR ${formatPercent(finance.irr, 1)}`} />
      </div>

      {/* Summary banner */}
      <Card className="bg-gradient-to-br from-solar-50 to-white">
        <p className="text-sm leading-relaxed text-ink-700">
          A <strong>{formatNumber(sizing.systemSizeKWp, 1)} kWp</strong> array
          {sizing.grossAreaM2 > 0 && <> on ~{formatNumber(sizing.grossAreaM2)} m²</>} here is
          estimated to generate <strong>{formatKWh(generation.annualGenerationKWh)}</strong> in
          year one — meeting <strong>{formatPercent(energyFlow.selfSufficiencyFraction)}</strong> of
          your {formatKWh(result.input.consumption.annualKWh)} demand. Net cost after incentives is{' '}
          <strong>{formatMoneyExact(finance.netCapex, currency)}</strong>, paying back in{' '}
          <strong>{formatYears(finance.paybackYears)}</strong> and returning a lifetime{' '}
          <strong>{formatMoney(finance.lifetimeSavings, currency)}</strong> with an NPV of{' '}
          <strong>{formatMoney(finance.npv, currency)}</strong>. Over {result.input.finance.analysisYears} years
          it avoids <strong>{formatTonnes(environment.lifetimeCO2Kg)}</strong> of CO₂.
        </p>
      </Card>

      {/* Bill before vs after */}
      <Card>
        <SectionHeading title="Your electricity bill" subtitle="Before vs after going solar" icon="🧾" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Bill before" value={`${formatMoney(billBeforeAnnual / 12, currency)}/mo`} sub={`${formatMoney(billBeforeAnnual, currency)}/yr`} />
          <Stat label="Bill after" value={`${formatMoney(billAfterAnnual / 12, currency)}/mo`} sub={`${formatMoney(billAfterAnnual, currency)}/yr`} accent="green" />
          <Stat label="You keep" value={formatPercent(billReduction)} sub="lower bills" accent="solar" />
          <Stat label="Self-sufficiency" value={formatPercent(energyFlow.selfSufficiencyFraction)} sub="powered by you" accent="sky" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="w-20 text-xs text-ink-500">Before</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-rose-400" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="w-20 text-xs text-ink-500">After</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.max(2, Math.min(100, (billAfterAnnual / Math.max(billBeforeAnnual, 1)) * 100))}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Energy generation */}
      <Card>
        <SectionHeading title="Energy generation" subtitle="Monthly output vs your demand" icon="📊" />
        <MonthlyGenerationChart monthly={generation.monthlyGenerationKWh} monthlyConsumption={monthlyConsumption} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Specific yield" value={`${formatNumber(generation.specificYield)}`} sub="kWh per kWp" />
          <Stat label="Plane-of-array" value={`${formatNumber(generation.annualPOA)}`} sub={`kWh/m² · ×${generation.transpositionFactor.toFixed(2)} vs flat`} />
          <Stat label="Performance ratio" value={formatPercent(pr.total)} sub="system efficiency" />
          <Stat label="Lifetime output" value={formatKWh(generation.lifetimeGenerationKWh)} sub={`${result.input.finance.analysisYears}-yr, degraded`} />
        </div>
        <details className="mt-3 rounded-xl bg-ink-50 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-ink-700">Performance ratio breakdown</summary>
          <div className="mt-3 space-y-2">
            {prRows.map((r) => (
              <div key={r.k} className="flex items-center gap-3">
                <span className="w-40 text-xs text-ink-500">{r.k}</span>
                <div className="flex-1"><ProgressBar value={r.v} /></div>
                <span className="w-12 text-right text-xs font-medium text-ink-700 tnum">{formatPercent(r.v)}</span>
              </div>
            ))}
          </div>
        </details>
      </Card>

      {/* Self-consumption / energy flow */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeading title="What happens to your solar" subtitle="Generation split" icon="🔌" />
          <Donut slices={genUse} centerValue={formatPercent(energyFlow.selfConsumptionFraction)} centerLabel="self-used" />
          <DonutLegend slices={genUse} />
        </Card>
        <Card>
          <SectionHeading title="Where your power comes from" subtitle="Demand coverage" icon="🏠" />
          <Donut slices={loadSource} centerValue={formatPercent(energyFlow.selfSufficiencyFraction)} centerLabel="self-sufficient" />
          <DonutLegend slices={loadSource} />
          {result.input.batteryKWh > 0 && (
            <p className="mt-2 text-center text-xs text-ink-500">
              🔋 Battery shifts {formatKWh(energyFlow.batteryContributionKWh)}/yr from day to night.
            </p>
          )}
        </Card>
      </div>

      {/* Financials */}
      <Card>
        <SectionHeading title="Financial picture" subtitle={`${result.input.finance.analysisYears}-year cumulative cashflow`} icon="💰" />
        <CashflowChart cashflow={finance.cashflow} currency={currency} paybackYears={finance.paybackYears} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Gross cost" value={formatMoney(finance.grossCapex, currency)} />
          <Stat label="Incentive" value={`−${formatMoney(finance.subsidyApplied, currency)}`} accent="green" />
          <Stat label="Net cost" value={formatMoney(finance.netCapex, currency)} accent="solar" />
          <Stat label="Lifetime savings" value={formatMoney(finance.lifetimeSavings, currency)} accent="green" />
          <Stat label="Net present value" value={formatMoney(finance.npv, currency)} />
          <Stat label="LCOE" value={`${currency}${finance.lcoe.toFixed(3)}`} sub="per kWh" />
        </div>
        <p className="mt-3 text-xs text-ink-400">
          ROI over horizon {formatPercent(finance.roi)} · LCOE compares to your import price of{' '}
          {currency}{result.input.tariff.importPrice.toFixed(2)}/kWh — solar is cheaper when LCOE is lower.
        </p>
      </Card>

      {/* Financing */}
      {financing && (
        <Card>
          <SectionHeading title="How to pay for it" subtitle="Cash vs. a solar loan" icon="🏦" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`rounded-xl border p-4 ${financingMode === 'cash' ? 'border-solar-300 bg-solar-50' : 'border-ink-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-ink-900">💵 Pay cash</h4>
                {financingMode === 'cash' && <Badge tone="solar">selected</Badge>}
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row label="Up-front" value={formatMoneyExact(finance.netCapex, currency)} />
                <Row label="Payback" value={formatYears(finance.paybackYears)} />
                <Row label="Lifetime gain" value={formatMoney(finance.lifetimeSavings, currency)} accent />
              </div>
            </div>
            <div className={`rounded-xl border p-4 ${financingMode === 'loan' ? 'border-solar-300 bg-solar-50' : 'border-ink-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-ink-900">🏦 Solar loan</h4>
                {financingMode === 'loan' && <Badge tone="solar">selected</Badge>}
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row label="Down-payment" value={formatMoneyExact(financing.loan.downPayment, currency)} />
                <Row label="Monthly payment" value={`${formatMoney(financing.loan.monthlyPayment, currency)}/mo`} />
                <Row label="Monthly solar saving" value={`${formatMoney(financing.loan.year1MonthlySaving, currency)}/mo`} accent />
                <Row
                  label="Net monthly (yr 1)"
                  value={`${financing.loan.year1NetMonthly >= 0 ? '+' : ''}${formatMoney(financing.loan.year1NetMonthly, currency)}/mo`}
                  accent={financing.loan.year1NetMonthly >= 0}
                />
                <Row label="Total interest" value={formatMoney(financing.loan.totalInterest, currency)} />
              </div>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            {financing.loan.year1NetMonthly >= 0 ? (
              <>✅ With this loan you're <strong>cashflow-positive from year one</strong> — the monthly bill savings exceed the loan repayment, so solar effectively pays for itself as you go.</>
            ) : (
              <>A loan spreads the cost but adds {formatMoney(financing.loan.totalInterest, currency)} of interest. Year-one repayments exceed savings by {formatMoney(-financing.loan.year1NetMonthly, currency)}/mo, narrowing as electricity prices rise. Adjust the loan terms under <em>Advanced</em>.</>
            )}
          </p>
        </Card>
      )}

      {/* Environmental */}
      <Card className="bg-gradient-to-br from-emerald-50 to-white">
        <SectionHeading title="Environmental impact" subtitle="Carbon avoided & equivalents" icon="🌍" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="CO₂ / year" value={formatTonnes(environment.annualCO2Kg)} accent="green" />
          <Stat label="CO₂ lifetime" value={formatTonnes(environment.lifetimeCO2Kg)} accent="green" />
          <Stat label="🌳 Trees / yr" value={formatNumber(environment.treesEquivalent)} sub="absorption equiv." />
          <Stat label="🚗 Cars / yr" value={formatNumber(environment.carsEquivalent, 1)} sub="off the road" />
          <Stat label="⚡ Energy payback" value={formatYears(environment.energyPaybackYears)} sub="vs 25–30 yr life" />
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Equivalent to avoiding {formatNumber(environment.flightsEquivalent)} one-way transatlantic
          flights over the system's life. The array repays its own manufacturing energy in about{' '}
          {formatYears(environment.energyPaybackYears)}.
        </p>
      </Card>

      {/* Orientation guidance */}
      <Card>
        <SectionHeading title="Orientation & siting" subtitle="How your setup compares to ideal" icon="🧭" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="stat-label">Your orientation</div>
            <div className="text-lg font-bold text-ink-900">
              {formatNumber(result.input.orientation.tiltDeg)}° tilt · {azimuthLabel(result.input.orientation.azimuthDeg)}
            </div>
          </div>
          <div>
            <div className="stat-label">Optimal here</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatNumber(result.optimalOrientation.tiltDeg)}° tilt · {azimuthLabel(result.optimalOrientation.azimuthDeg)}
            </div>
          </div>
          <div>
            <div className="stat-label">You're capturing</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-solar-600">{formatPercent(result.orientationEfficiency)}</span>
              <Badge tone={result.orientationEfficiency >= 0.95 ? 'green' : result.orientationEfficiency >= 0.85 ? 'amber' : 'rose'}>
                {result.orientationEfficiency >= 0.95 ? 'Excellent' : result.orientationEfficiency >= 0.85 ? 'Good' : 'Improvable'}
              </Badge>
            </div>
            <div className="mt-1"><ProgressBar value={result.orientationEfficiency} tone="solar" /></div>
          </div>
        </div>
        {result.orientationEfficiency < 0.92 && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            💡 Adjusting toward {formatNumber(result.optimalOrientation.tiltDeg)}° tilt facing{' '}
            {azimuthLabel(result.optimalOrientation.azimuthDeg)} could lift annual output by roughly{' '}
            {formatPercent(1 / result.orientationEfficiency - 1)}. Use the Optimizer to explore trade-offs.
          </p>
        )}
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={`font-semibold tnum ${accent ? 'text-emerald-600' : 'text-ink-800'}`}>{value}</span>
    </div>
  )
}
