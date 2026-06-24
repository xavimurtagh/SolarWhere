import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { runAssessment } from '../../lib/assess'
import { findRegion, regionsByCountry } from '../../lib/data/regions'
import { PANELS } from '../../lib/data/panels'
import { SURFACE_TYPES } from '../../lib/solar/system'
import { BATTERY_SIZES, suggestBatterySize } from '../../lib/solar/battery'
import { compareFinancing } from '../../lib/solar/financing'
import {
  type CalculatorState,
  type SavedScenario,
  buildShareUrl,
  defaultState,
  deleteScenario,
  effectiveAnnualKWh,
  listScenarios,
  loadLast,
  normalizeState,
  saveLast,
  saveScenario,
  stateFromUrl,
  stateToBuildParams,
} from '../../lib/scenario'
import { azimuthLabel, formatMoney, formatNumber, formatPercent } from '../../lib/format'
import {
  Badge,
  Card,
  Field,
  SectionHeading,
  Segmented,
  Slider,
} from '../../components/ui/primitives'
import { ResultsDashboard } from './ResultsDashboard'
import { downloadCsv, buildReportCsv } from './report'

// Lazy so Leaflet (and its CSS) only loads when the map is actually opened.
const MapAreaPicker = lazy(() =>
  import('../../components/MapAreaPicker').then((m) => ({ default: m.MapAreaPicker })),
)

const USAGE_PRESETS = [
  { id: 'home-low', label: 'Small home', annualKWh: 2500, daytime: 0.25 },
  { id: 'home-avg', label: 'Average home', annualKWh: 4500, daytime: 0.3 },
  { id: 'home-ev', label: 'Home + EV / heat pump', annualKWh: 8000, daytime: 0.35 },
  { id: 'business', label: 'Small business', annualKWh: 20000, daytime: 0.6 },
] as const

const AZIMUTH_PRESETS = [
  { label: 'N', deg: 0 },
  { label: 'E', deg: 90 },
  { label: 'S', deg: 180 },
  { label: 'W', deg: 270 },
]

const CURRENCIES = ['$', '€', '£', 'A$', 'C$', '₹', '¥', 'R$', 'R']

function initialState(): CalculatorState {
  return normalizeState(stateFromUrl() ?? loadLast())
}

export default function Calculator() {
  const [state, setState] = useState<CalculatorState>(initialState)
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setScenarios(listScenarios())
  }, [])
  useEffect(() => {
    saveLast(state)
  }, [state])

  const region = findRegion(state.regionId)
  const update = (patch: Partial<CalculatorState>) => setState((s) => ({ ...s, ...patch }))

  // Changing region resets region-derived assumptions (price, incentive, etc.).
  const changeRegion = (id: string) => {
    const r = findRegion(id)
    update({
      regionId: id,
      importPrice: r.electricityPrice,
      exportPrice: r.exportPrice,
      subsidyFraction: r.incentiveFraction,
      currency: r.currency,
      azimuthDeg: r.lat >= 0 ? 180 : 0,
    })
  }

  const changeSurface = (type: CalculatorState['surfaceType']) => {
    const meta = SURFACE_TYPES.find((s) => s.type === type)
    update({
      surfaceType: type,
      tiltDeg: meta ? meta.defaultTilt : state.tiltDeg,
      ...(type === 'ground-field' ? { sizingMode: 'area' as const } : {}),
    })
  }

  const result = useMemo(() => runAssessment(stateToBuildParams(state)), [state])

  const financing = useMemo(() => {
    const savingsByYear = result.finance.cashflow.filter((c) => c.year >= 1).map((c) => c.net)
    return compareFinancing(result.finance.netCapex, savingsByYear, {
      aprPerYear: state.loanApr,
      termYears: state.loanTermYears,
      downFraction: state.downFraction,
    })
  }, [result, state.loanApr, state.loanTermYears, state.downFraction])

  const effectiveKWh = effectiveAnnualKWh(state)
  const suggestedBattery = suggestBatterySize(result.generation.annualGenerationKWh, {
    annualKWh: effectiveKWh,
    daytimeFraction: state.daytimeFraction,
  })

  const grouped = regionsByCountry()
  const noPanelsFit = state.sizingMode === 'area' && result.sizing.panelCount === 0

  const handleSave = () => {
    const name = `${region.name} · ${formatNumber(result.sizing.systemSizeKWp, 1)}kWp${state.batteryKWh ? ` +${state.batteryKWh}kWh` : ''}`
    setScenarios(saveScenario(name, state, Date.now()))
  }
  const handleShare = async () => {
    const url = buildShareUrl(state)
    try {
      if (typeof window !== 'undefined') window.location.hash = `s=${url.split('#s=')[1] ?? ''}`
      await navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }
  const handleReset = () => setState(defaultState())

  return (
    <div className="space-y-4">
      {/* Scenario toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <button className="btn-primary px-3 py-2 text-xs" onClick={handleSave}>💾 Save scenario</button>
        <button className="btn-outline px-3 py-2 text-xs" onClick={handleShare}>{copied ? '✓ Link copied' : '🔗 Share'}</button>
        {scenarios.length > 0 && (
          <button className="btn-outline px-3 py-2 text-xs" onClick={() => setCompareOpen((o) => !o)}>
            ⚖️ Compare ({scenarios.length})
          </button>
        )}
        <button className="btn-outline px-3 py-2 text-xs" onClick={() => downloadCsv(buildReportCsv(state, result), 'solarwhere-report.csv')}>⬇️ CSV</button>
        <button className="btn-outline px-3 py-2 text-xs" onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn-ghost px-3 py-2 text-xs" onClick={handleReset}>↺ Reset</button>
        {scenarios.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scenarios.map((sc) => (
              <span key={sc.id} className="chip bg-ink-100 text-ink-600">
                <button onClick={() => setState(normalizeState(sc.state))} title="Load scenario">{sc.name}</button>
                <button className="ml-1 text-ink-400 hover:text-rose-500" onClick={() => setScenarios(deleteScenario(sc.id))} aria-label={`Delete ${sc.name}`}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mobile sticky headline summary (live as you edit inputs) */}
      <div className="no-print sticky top-[92px] z-10 grid grid-cols-4 gap-2 rounded-xl border border-ink-100 bg-white/95 p-2 shadow-card backdrop-blur lg:hidden">
        <MiniSummary label="Size" value={`${formatNumber(result.sizing.systemSizeKWp, 1)}kWp`} />
        <MiniSummary label="Gen/yr" value={`${formatNumber(result.generation.annualGenerationKWh / 1000, 1)}MWh`} />
        <MiniSummary label="Saves" value={`${formatMoney(result.finance.year1Savings, state.currency)}`} />
        <MiniSummary label="Payback" value={isFinite(result.finance.paybackYears) ? `${result.finance.paybackYears.toFixed(1)}y` : '—'} />
      </div>

      {compareOpen && scenarios.length > 0 && (
        <ComparisonTable current={state} scenarios={scenarios} />
      )}

      <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
        {/* ── Inputs ─────────────────────────────────────────── */}
        <div className="no-print space-y-4">
          <Card>
            <SectionHeading title="Your site" subtitle="Location sets sun, prices & policy" icon="📍" />
            <div className="space-y-4">
              <Field label="Location / climate">
                <select className="select" value={state.regionId} onChange={(e) => changeRegion(e.target.value)} aria-label="Location">
                  {Object.entries(grouped).map(([country, regions]) => (
                    <optgroup key={country} label={country}>
                      {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Sun" value={`${formatNumber(region.annualGHI)}`} unit="kWh/m²/yr" />
                <MiniStat label="Price" value={`${state.currency}${state.importPrice.toFixed(2)}`} unit="per kWh" />
                <MiniStat label="Grid CO₂" value={`${region.gridCarbonKgPerKWh.toFixed(2)}`} unit="kg/kWh" />
              </div>
              {region.incentiveNote && (
                <p className="rounded-lg bg-solar-50 px-3 py-2 text-xs text-solar-800">🎁 {region.incentiveNote}</p>
              )}
              <Field label="Mounting surface">
                <div className="grid grid-cols-2 gap-2">
                  {SURFACE_TYPES.map((s) => (
                    <button
                      key={s.type}
                      onClick={() => changeSurface(s.type)}
                      aria-pressed={state.surfaceType === s.type}
                      className={`rounded-xl border p-2.5 text-left text-xs transition focus-visible:ring-2 focus-visible:ring-solar-300 ${
                        state.surfaceType === s.type ? 'border-solar-400 bg-solar-50' : 'border-ink-200 bg-white hover:border-ink-300'
                      }`}
                    >
                      <div className="text-base">{s.icon}</div>
                      <div className="font-semibold text-ink-800">{s.label}</div>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <SectionHeading title="System size" subtitle="From your area, or set capacity" icon="📐" />
            <div className="space-y-4">
              <Segmented
                value={state.sizingMode}
                onChange={(v) => update({ sizingMode: v })}
                options={[{ value: 'area', label: 'By area' }, { value: 'capacity', label: 'By capacity' }]}
              />
              {state.sizingMode === 'area' ? (
                <>
                  <Segmented
                    value={state.areaMode}
                    onChange={(v) => update({ areaMode: v })}
                    options={[{ value: 'manual', label: 'Enter area' }, { value: 'map', label: 'Draw on map' }]}
                  />
                  {state.areaMode === 'manual' ? (
                    <Field label="Available area" hint="Gross roof or land area to cover">
                      <div className="flex items-center gap-2">
                        <input type="number" className="input" value={state.areaM2} min={1} onChange={(e) => update({ areaM2: Math.max(0, parseFloat(e.target.value) || 0) })} aria-label="Available area in square metres" />
                        <span className="text-sm text-ink-500">m²</span>
                      </div>
                      <div className="mt-2">
                        <Slider value={state.areaM2} min={5} max={state.surfaceType === 'ground-field' ? 50000 : 400} step={5} onChange={(v) => update({ areaM2: v })} suffix=" m²" />
                      </div>
                    </Field>
                  ) : (
                    <Suspense fallback={<div className="flex h-[340px] items-center justify-center rounded-2xl border border-ink-200 text-sm text-ink-400">Loading map…</div>}>
                      <MapAreaPicker center={[region.lat, region.lon]} onAreaChange={(a) => { if (a > 0) update({ areaM2: a }) }} />
                    </Suspense>
                  )}
                </>
              ) : (
                <Field label="System capacity">
                  <Slider value={state.systemSizeKWp} min={1} max={state.surfaceType === 'ground-field' ? 5000 : 30} step={state.surfaceType === 'ground-field' ? 25 : 0.5} onChange={(v) => update({ systemSizeKWp: v })} format={(v) => `${formatNumber(v, 1)} kWp`} />
                </Field>
              )}
              <Field label="Panel type">
                <select className="select" value={state.panelId} onChange={(e) => update({ panelId: e.target.value })} aria-label="Panel type">
                  {PANELS.map((p) => (<option key={p.id} value={p.id}>{p.name} · {(p.efficiency * 100).toFixed(1)}%</option>))}
                </select>
              </Field>
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 p-3">
                <Badge tone="solar">{formatNumber(result.sizing.systemSizeKWp, 1)} kWp</Badge>
                <Badge>{result.sizing.panelCount} panels</Badge>
                {state.sizingMode === 'capacity' && <Badge>~{formatNumber(result.sizing.grossAreaM2)} m² needed</Badge>}
                {state.sizingMode === 'area' && <Badge>{formatNumber(result.sizing.moduleAreaM2)} m² of panels</Badge>}
              </div>
              {noPanelsFit && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">⚠️ No panels fit in this area yet — increase the area or draw a larger outline.</p>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Orientation & shading" subtitle="Tilt, direction & obstructions" icon="🧭" />
            <div className="space-y-4">
              <Field label={`Tilt — ${formatNumber(state.tiltDeg)}° from horizontal`}>
                <Slider value={state.tiltDeg} min={0} max={90} step={1} onChange={(v) => update({ tiltDeg: v })} suffix="°" />
              </Field>
              <Field label={`Facing — ${azimuthLabel(state.azimuthDeg)} (${formatNumber(state.azimuthDeg)}°)`}>
                <Slider value={state.azimuthDeg} min={0} max={360} step={5} onChange={(v) => update({ azimuthDeg: v })} format={(v) => `${azimuthLabel(v)} · ${v}°`} />
                <div className="mt-2 flex gap-2">
                  {AZIMUTH_PRESETS.map((a) => (
                    <button key={a.label} onClick={() => update({ azimuthDeg: a.deg })} className="btn-outline flex-1 px-2 py-1 text-xs">{a.label}</button>
                  ))}
                  <button onClick={() => update({ tiltDeg: result.optimalOrientation.tiltDeg, azimuthDeg: result.optimalOrientation.azimuthDeg })} className="btn-primary px-2 py-1 text-xs">✨ Optimal</button>
                </div>
              </Field>
              <Field label={`Shading loss — ${formatNumber(state.shadingPct)}%`} hint="Trees, chimneys, nearby buildings">
                <Slider value={state.shadingPct} min={0} max={60} step={1} onChange={(v) => update({ shadingPct: v })} suffix="%" />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Energy use & storage" subtitle="Your demand and battery" icon="⚡" />
            <div className="space-y-4">
              <Segmented
                value={state.consumptionMode}
                onChange={(v) => update({ consumptionMode: v })}
                options={[{ value: 'kwh', label: 'I know my kWh' }, { value: 'bill', label: 'I know my bill' }]}
              />
              {state.consumptionMode === 'kwh' ? (
                <>
                  <Field label="Usage profile">
                    <div className="grid grid-cols-2 gap-2">
                      {USAGE_PRESETS.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => update({ annualKWh: u.annualKWh, daytimeFraction: u.daytime })}
                          className={`rounded-xl border p-2 text-xs transition ${state.annualKWh === u.annualKWh ? 'border-sky2-400 bg-sky2-50' : 'border-ink-200 hover:border-ink-300'}`}
                        >
                          <div className="font-semibold text-ink-800">{u.label}</div>
                          <div className="text-ink-400">{formatNumber(u.annualKWh)} kWh/yr</div>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Annual consumption" hint="Find this on your electricity bill">
                    <div className="flex items-center gap-2">
                      <input type="number" className="input" value={state.annualKWh} min={0} onChange={(e) => update({ annualKWh: Math.max(0, parseFloat(e.target.value) || 0) })} aria-label="Annual consumption in kWh" />
                      <span className="text-sm text-ink-500">kWh/yr</span>
                    </div>
                  </Field>
                </>
              ) : (
                <Field label="Average monthly electricity bill" hint={`≈ ${formatNumber(effectiveKWh)} kWh/yr at ${state.currency}${state.importPrice.toFixed(2)}/kWh`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-500">{state.currency}</span>
                    <input type="number" className="input" value={state.monthlyBill} min={0} onChange={(e) => update({ monthlyBill: Math.max(0, parseFloat(e.target.value) || 0) })} aria-label="Average monthly bill" />
                    <span className="text-sm text-ink-500">/mo</span>
                  </div>
                </Field>
              )}
              <Field label="Battery storage">
                <div className="flex flex-wrap gap-2">
                  {BATTERY_SIZES.map((b) => (
                    <button
                      key={b}
                      onClick={() => update({ batteryKWh: b })}
                      aria-pressed={state.batteryKWh === b}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${state.batteryKWh === b ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}
                    >
                      {b === 0 ? 'None' : `${b} kWh`}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-400">💡 Suggested: <strong>{suggestedBattery} kWh</strong>. See the Battery Advisor for payback.</p>
              </Field>
            </div>
          </Card>

          <AdvancedPanel state={state} update={update} />
        </div>

        {/* ── Results ────────────────────────────────────────── */}
        <div id="solar-report">
          <PrintHeader state={state} regionName={region.name} />
          <ResultsDashboard result={result} financing={financing} financingMode={state.financingMode} />
        </div>
      </div>
    </div>
  )
}

function AdvancedPanel({ state, update }: { state: CalculatorState; update: (p: Partial<CalculatorState>) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((s) => !s)} aria-expanded={open}>
        <span className="section-title">Advanced & financing</span>
        <span className="text-ink-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Currency">
              <select className="select" value={state.currency} onChange={(e) => update({ currency: e.target.value })} aria-label="Currency symbol">
                {CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </Field>
            <Field label="Import price">
              <input type="number" step={0.01} className="input" value={state.importPrice} onChange={(e) => update({ importPrice: parseFloat(e.target.value) || 0 })} aria-label="Import price per kWh" />
            </Field>
            <Field label="Export price">
              <input type="number" step={0.01} className="input" value={state.exportPrice} onChange={(e) => update({ exportPrice: parseFloat(e.target.value) || 0 })} aria-label="Export price per kWh" />
            </Field>
          </div>
          <Field label={`Up-front incentive — ${formatNumber(state.subsidyFraction * 100)}% of cost`}>
            <Slider value={state.subsidyFraction * 100} min={0} max={60} step={1} onChange={(v) => update({ subsidyFraction: v / 100 })} suffix="%" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Daytime use ${formatNumber(state.daytimeFraction * 100)}%`}>
              <Slider value={state.daytimeFraction * 100} min={5} max={95} step={5} onChange={(v) => update({ daytimeFraction: v / 100 })} suffix="%" />
            </Field>
            <Field label={`Price inflation ${formatNumber(state.inflation * 100)}%`}>
              <Slider value={state.inflation * 100} min={0} max={8} step={0.5} onChange={(v) => update({ inflation: v / 100 })} suffix="%" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Discount rate ${formatNumber(state.discountRate * 100)}%`}>
              <Slider value={state.discountRate * 100} min={0} max={12} step={0.5} onChange={(v) => update({ discountRate: v / 100 })} suffix="%" />
            </Field>
            <Field label={`Horizon ${state.analysisYears} yr`}>
              <Slider value={state.analysisYears} min={10} max={30} step={1} onChange={(v) => update({ analysisYears: v })} suffix=" yr" />
            </Field>
          </div>
          <Field label={`Ground reflectance (albedo) ${state.albedo.toFixed(2)}`} hint="Grass 0.2 · concrete 0.3 · snow 0.6">
            <Slider value={state.albedo * 100} min={10} max={70} step={5} onChange={(v) => update({ albedo: v / 100 })} suffix="%" />
          </Field>

          <div className="rounded-xl border border-ink-100 p-3">
            <div className="mb-2 text-sm font-semibold text-ink-700">Financing</div>
            <Segmented value={state.financingMode} onChange={(v) => update({ financingMode: v })} options={[{ value: 'cash', label: 'Pay cash' }, { value: 'loan', label: 'Solar loan' }]} />
            {state.financingMode === 'loan' && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Field label={`APR ${formatNumber(state.loanApr * 100, 1)}%`}>
                  <Slider value={state.loanApr * 100} min={0} max={15} step={0.5} onChange={(v) => update({ loanApr: v / 100 })} suffix="%" />
                </Field>
                <Field label={`Term ${state.loanTermYears} yr`}>
                  <Slider value={state.loanTermYears} min={3} max={25} step={1} onChange={(v) => update({ loanTermYears: v })} suffix=" yr" />
                </Field>
                <Field label={`Deposit ${formatNumber(state.downFraction * 100)}%`}>
                  <Slider value={state.downFraction * 100} min={0} max={50} step={5} onChange={(v) => update({ downFraction: v / 100 })} suffix="%" />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function ComparisonTable({ current, scenarios }: { current: CalculatorState; scenarios: SavedScenario[] }) {
  const cols = [
    { name: 'Current', state: current },
    ...scenarios.map((s) => ({ name: s.name, state: s.state })),
  ]
  const metrics = cols.map((c) => {
    const r = runAssessment(stateToBuildParams(c.state))
    return {
      name: c.name,
      currency: r.finance.currency,
      kWp: r.sizing.systemSizeKWp,
      gen: r.generation.annualGenerationKWh,
      savings: r.finance.year1Savings,
      payback: r.finance.paybackYears,
      npv: r.finance.npv,
      selfSuff: r.energyFlow.selfSufficiencyFraction,
      netCost: r.finance.netCapex,
      co2: r.environment.annualCO2Kg,
    }
  })
  const rows: { label: string; fmt: (m: (typeof metrics)[number]) => string }[] = [
    { label: 'System size', fmt: (m) => `${formatNumber(m.kWp, 1)} kWp` },
    { label: 'Generation/yr', fmt: (m) => `${formatNumber(m.gen)} kWh` },
    { label: 'Year-1 savings', fmt: (m) => formatMoney(m.savings, m.currency) },
    { label: 'Payback', fmt: (m) => (isFinite(m.payback) ? `${m.payback.toFixed(1)} yr` : 'never') },
    { label: 'Net cost', fmt: (m) => formatMoney(m.netCost, m.currency) },
    { label: '25-yr NPV', fmt: (m) => formatMoney(m.npv, m.currency) },
    { label: 'Self-sufficiency', fmt: (m) => formatPercent(m.selfSuff) },
    { label: 'CO₂/yr', fmt: (m) => `${formatNumber(m.co2)} kg` },
  ]
  return (
    <Card>
      <SectionHeading title="Compare scenarios" subtitle="Your current setup vs. saved scenarios" icon="⚖️" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="py-2 pr-4">Metric</th>
              {metrics.map((m, i) => (<th key={i} className="py-2 pr-4">{m.name}</th>))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-ink-100">
                <td className="py-2 pr-4 font-medium text-ink-600">{row.label}</td>
                {metrics.map((m, i) => (<td key={i} className="py-2 pr-4 tnum text-ink-800">{row.fmt(m)}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function PrintHeader({ state, regionName }: { state: CalculatorState; regionName: string }) {
  return (
    <div className="mb-4 hidden print:block">
      <h1 className="text-2xl font-bold text-ink-900">SolarWhere report — {regionName}</h1>
      <p className="text-sm text-ink-500">
        {state.surfaceType} · {state.tiltDeg}° tilt facing {azimuthLabel(state.azimuthDeg)} · {state.batteryKWh ? `${state.batteryKWh} kWh battery` : 'no battery'}
      </p>
    </div>
  )
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="text-sm font-bold text-ink-900 tnum">{value}</div>
    </div>
  )
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-ink-50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="text-sm font-bold text-ink-800 tnum">{value}</div>
      <div className="text-[10px] text-ink-400">{unit}</div>
    </div>
  )
}
