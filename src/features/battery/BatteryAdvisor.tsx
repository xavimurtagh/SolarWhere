import { useMemo, useState } from 'react'
import { runAssessment } from '../../lib/assess'
import { DEFAULT_REGION, findRegion, regionsByCountry } from '../../lib/data/regions'
import { DEFAULT_PANEL } from '../../lib/data/panels'
import { BATTERY_SIZES } from '../../lib/solar/battery'
import {
  formatMoney,
  formatPercent,
  formatYears,
} from '../../lib/format'
import {
  Badge,
  Card,
  Field,
  SectionHeading,
  Segmented,
  Slider,
} from '../../components/ui/primitives'
import { SensitivityLine } from '../../components/charts/Charts'

const USAGE_PRESETS = [
  { id: 'home-avg', label: 'Average home', annualKWh: 4500, daytime: 0.3 },
  { id: 'home-ev', label: 'Home + EV', annualKWh: 8000, daytime: 0.35 },
  { id: 'business', label: 'Small business', annualKWh: 20000, daytime: 0.6 },
]

export default function BatteryAdvisor() {
  const [regionId, setRegionId] = useState(DEFAULT_REGION.id)
  const region = findRegion(regionId)
  const [systemSizeKWp, setSystemSizeKWp] = useState(5)
  const [usageId, setUsageId] = useState('home-avg')
  const usage = USAGE_PRESETS.find((u) => u.id === usageId) ?? USAGE_PRESETS[0]

  const scenarios = useMemo(() => {
    return BATTERY_SIZES.map((size) => {
      const r = runAssessment({
        region,
        surfaceType: 'roof-pitched',
        systemSizeKWp,
        orientation: { tiltDeg: Math.abs(region.lat), azimuthDeg: region.lat >= 0 ? 180 : 0 },
        shadingFraction: 0.05,
        panel: DEFAULT_PANEL,
        consumption: { annualKWh: usage.annualKWh, daytimeFraction: usage.daytime },
        batteryKWh: size,
      })
      return { size, r }
    })
  }, [region, systemSizeKWp, usage.annualKWh, usage.daytime])

  const base = scenarios[0].r
  const rows = scenarios.map(({ size, r }) => {
    const extraAnnual = r.finance.year1Savings - base.finance.year1Savings
    const battCapex = r.finance.grossCapex - base.finance.grossCapex
    const payback = extraAnnual > 0 ? battCapex / extraAnnual : Infinity
    const incrementalNpv = r.finance.npv - base.finance.npv
    return {
      size,
      selfSufficiency: r.energyFlow.selfSufficiencyFraction,
      selfConsumption: r.energyFlow.selfConsumptionFraction,
      extraAnnual,
      battCapex,
      payback,
      incrementalNpv,
    }
  })

  // Recommendation: best incremental NPV among real batteries (>0 size).
  const candidates = rows.filter((r) => r.size > 0)
  const best = candidates.reduce(
    (a, b) => (b.incrementalNpv > a.incrementalNpv ? b : a),
    candidates[0],
  )
  const worthIt = best.incrementalNpv > 0 && best.payback < 15

  const ssCurve = rows.map((r) => ({ size: r.size, selfSufficiency: Math.round(r.selfSufficiency * 100) }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">🔋 Battery Storage Advisor</h1>
        <p className="mt-1 text-ink-500">
          A battery stores daytime surplus for evening use, boosts self-sufficiency
          and provides backup — but only sometimes pays for itself. Here's the maths
          for your situation.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <Card>
          <SectionHeading title="Your setup" icon="⚙️" />
          <div className="space-y-4">
            <Field label="Location">
              <select className="select" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                {Object.entries(regionsByCountry()).map(([country, regions]) => (
                  <optgroup key={country} label={country}>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Solar system size">
              <Slider value={systemSizeKWp} min={2} max={20} step={0.5} onChange={setSystemSizeKWp} format={(v) => `${v.toFixed(1)} kWp`} />
            </Field>
            <Field label="Usage profile">
              <Segmented value={usageId} onChange={setUsageId} options={USAGE_PRESETS.map((u) => ({ value: u.id, label: u.label }))} />
            </Field>
            <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
              Import {region.currency}{region.electricityPrice.toFixed(2)} · Export {region.currency}{region.exportPrice.toFixed(2)} per kWh.
              The bigger the gap, the more a battery is worth (you avoid buying expensive grid power instead of selling cheap).
            </div>
          </div>
        </Card>

        {/* Verdict + chart */}
        <div className="space-y-5">
          <Card className={worthIt ? 'bg-gradient-to-br from-emerald-50 to-white' : 'bg-gradient-to-br from-amber-50 to-white'}>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{worthIt ? '✅' : '🤔'}</div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">
                  {worthIt
                    ? `A ${best.size} kWh battery looks worthwhile`
                    : `A battery is mostly about resilience here, not payback`}
                </h2>
                <p className="mt-1 text-sm text-ink-600">
                  The strongest option is a <strong>{best.size} kWh</strong> battery: it lifts self-sufficiency to{' '}
                  <strong>{formatPercent(best.selfSufficiency)}</strong>, saves an extra{' '}
                  <strong>{formatMoney(best.extraAnnual, region.currency)}/yr</strong>, costs about{' '}
                  <strong>{formatMoney(best.battCapex, region.currency)}</strong> and pays back in{' '}
                  <strong>{formatYears(best.payback)}</strong> (net present value {formatMoney(best.incrementalNpv, region.currency)}).{' '}
                  {worthIt
                    ? 'That beats leaving the money invested elsewhere.'
                    : 'Payback is long versus the ~10–15 year battery life, so buy it for backup power and energy independence rather than pure savings.'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Self-sufficiency vs battery size" subtitle="How much of your demand solar+battery can cover" icon="📈" />
            <SensitivityLine data={ssCurve} xKey="size" yKey="selfSufficiency" xLabel="Battery (kWh)" color="green" highlightX={best.size} />
          </Card>
        </div>
      </div>

      {/* Comparison table */}
      <Card>
        <SectionHeading title="Battery size comparison" subtitle="Diminishing returns set in once you can cover the evening" icon="📋" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 pr-4">Battery</th>
                <th className="py-2 pr-4">Self-sufficiency</th>
                <th className="py-2 pr-4">Self-consumption</th>
                <th className="py-2 pr-4">Extra saving/yr</th>
                <th className="py-2 pr-4">Cost</th>
                <th className="py-2 pr-4">Payback</th>
                <th className="py-2 pr-4">25-yr NPV</th>
                <th className="py-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.size} className={`border-b border-ink-100 ${r.size === best.size ? 'bg-emerald-50/60' : ''}`}>
                  <td className="py-2 pr-4 font-semibold text-ink-800">{r.size === 0 ? 'No battery' : `${r.size} kWh`}</td>
                  <td className="py-2 pr-4 tnum">{formatPercent(r.selfSufficiency)}</td>
                  <td className="py-2 pr-4 tnum">{formatPercent(r.selfConsumption)}</td>
                  <td className="py-2 pr-4 tnum">{r.size === 0 ? '—' : formatMoney(r.extraAnnual, region.currency)}</td>
                  <td className="py-2 pr-4 tnum">{r.size === 0 ? '—' : formatMoney(r.battCapex, region.currency)}</td>
                  <td className="py-2 pr-4 tnum">{r.size === 0 ? '—' : formatYears(r.payback)}</td>
                  <td className={`py-2 pr-4 tnum ${r.incrementalNpv >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.size === 0 ? '—' : formatMoney(r.incrementalNpv, region.currency)}</td>
                  <td className="py-2">
                    {r.size === 0 ? (
                      <Badge>baseline</Badge>
                    ) : r.incrementalNpv > 0 && r.payback < 15 ? (
                      <Badge tone="green">worth it</Badge>
                    ) : r.payback < 20 ? (
                      <Badge tone="amber">marginal</Badge>
                    ) : (
                      <Badge tone="rose">resilience only</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          NPV excludes a mid-life battery replacement (~year 12–15) and any time-of-use or backup value — all of which can swing the decision. Treat this as a financial baseline.
        </p>
      </Card>

      {/* When to get one */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeading title="Good reasons to add a battery" icon="👍" />
          <ul className="space-y-2 text-sm text-ink-600">
            <li>⚡ <strong>Backup power</strong> through grid outages (with a compatible inverter).</li>
            <li>🌙 <strong>Use your own solar at night</strong> instead of buying expensive grid power.</li>
            <li>📊 <strong>Time-of-use arbitrage</strong> — charge cheap, discharge at peak rates.</li>
            <li>🏝️ <strong>Energy independence</strong> and protection from price rises.</li>
            <li>💸 Where the <strong>import price is far above the export price</strong>, every stored kWh is worth a lot.</li>
          </ul>
        </Card>
        <Card>
          <SectionHeading title="When to wait" icon="✋" />
          <ul className="space-y-2 text-sm text-ink-600">
            <li>💰 Generous <strong>net metering / 1:1 export</strong> — the grid is already your "free battery".</li>
            <li>☀️ <strong>High daytime use</strong> (you already self-consume most generation).</li>
            <li>📉 Payback longer than the <strong>battery warranty</strong> with no backup need.</li>
            <li>🪫 Very small surplus to store — an oversized battery just sits half-empty.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
