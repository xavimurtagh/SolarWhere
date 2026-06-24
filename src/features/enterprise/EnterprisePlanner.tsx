import { useMemo, useRef, useState } from 'react'
import { REGIONS, findRegion, regionsByCountry } from '../../lib/data/regions'
import { buildIrradianceProfile } from '../../lib/solar/irradiance'
import { findOptimalOrientation } from '../../lib/solar/geometry'
import { costPerWatt, systemCapex } from '../../lib/solar/costs'
import {
  KWP_PER_HECTARE,
  abatementCost,
  capacityForCO2Target,
  gridTargetPlan,
  hectaresToCapacity,
  homesPowered,
  lcoeLifetime,
  optimizePortfolio,
  parseSitesCSV,
  serializeSitesCSV,
  simplePayback,
  type PortfolioObjective,
  type PortfolioSite,
} from '../../lib/solar/optimize'
import {
  formatKWh,
  formatMoney,
  formatNumber,
  formatPercent,
  formatTonnes,
  formatYears,
} from '../../lib/format'
import {
  Badge,
  Card,
  Field,
  ProgressBar,
  SectionHeading,
  Segmented,
  Slider,
  Stat,
} from '../../components/ui/primitives'

const INDICATIVE_PR = 0.82
const ENTERPRISE_SELF_CONSUMPTION = 0.7

interface SiteRow {
  id: string
  name: string
  regionId: string
  capacityKWp: number
}

let idCounter = 100
const nextId = () => `site-${idCounter++}`

const INITIAL_SITES: SiteRow[] = [
  { id: 'site-1', name: 'HQ rooftop', regionId: 'us-losangeles', capacityKWp: 250 },
  { id: 'site-2', name: 'Distribution warehouse', regionId: 'es-madrid', capacityKWp: 800 },
  { id: 'site-3', name: 'Depot car park (carport)', regionId: 'uk-london', capacityKWp: 400 },
  { id: 'site-4', name: 'Greenfield solar farm', regionId: 'au-brisbane', capacityKWp: 5000 },
]

/** Quick per-site economics at the optimal orientation. */
function siteEconomics(site: SiteRow): PortfolioSite {
  const region = findRegion(site.regionId)
  const profile = buildIrradianceProfile(region.lat, region.annualGHI)
  const optimal = findOptimalOrientation(region.lat, profile.monthlyDailyGHI, 0.2)
  const specificYield = optimal.annualPOA * INDICATIVE_PR
  const annualGenerationKWh = site.capacityKWp * specificYield
  const capex = systemCapex(site.capacityKWp, region.costMultiplier)
  const blendedValue =
    ENTERPRISE_SELF_CONSUMPTION * region.electricityPrice +
    (1 - ENTERPRISE_SELF_CONSUMPTION) * region.exportPrice
  return {
    id: site.id,
    name: site.name,
    capex,
    annualGenerationKWh,
    annualCO2Kg: annualGenerationKWh * region.gridCarbonKgPerKWh,
    annualSavings: annualGenerationKWh * blendedValue,
    capacityKWp: site.capacityKWp,
  }
}

/** Cost-efficiency metrics derived from a site's economics. */
interface SiteEfficiency {
  lcoe: number // ≈ $/kWh lifetime
  abatement: number // $/tonne CO₂
  payback: number // years
}

function siteEfficiency(e: PortfolioSite): SiteEfficiency {
  return {
    lcoe: lcoeLifetime(e.capex, e.annualGenerationKWh),
    abatement: abatementCost(e.capex, e.annualCO2Kg),
    payback: simplePayback(e.capex, e.annualSavings),
  }
}

/** Format a small $/unit figure, guarding Infinity. */
function formatPerUnit(value: number, digits = 2): string {
  if (!isFinite(value)) return '—'
  return `$${value.toFixed(digits)}`
}

type SortKey =
  | 'name'
  | 'capacity'
  | 'cost'
  | 'generation'
  | 'lcoe'
  | 'abatement'
  | 'payback'
type SortDir = 'asc' | 'desc'

interface ColumnDef {
  key: SortKey
  label: string
  align: 'left' | 'right'
}

const PORTFOLIO_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Site', align: 'left' },
  { key: 'capacity', label: 'Capacity (kWp)', align: 'left' },
  { key: 'cost', label: 'Est. cost', align: 'right' },
  { key: 'generation', label: 'Gen/yr', align: 'right' },
  { key: 'lcoe', label: '≈ $/kWh lifetime', align: 'right' },
  { key: 'abatement', label: '$/t CO₂', align: 'right' },
  { key: 'payback', label: 'Payback', align: 'right' },
]

export default function EnterprisePlanner() {
  const [tab, setTab] = useState<'portfolio' | 'grid'>('portfolio')
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">🏛️ Enterprise & Government Planner</h1>
        <p className="mt-1 text-ink-500">
          Plan solar across many sites or at grid scale: allocate capital for
          maximum impact, and size build-outs to hit renewable targets.
        </p>
      </div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'portfolio', label: '📊 Multi-site portfolio' },
          { value: 'grid', label: '⚡ Grid-scale target' },
        ]}
      />
      {tab === 'portfolio' ? <PortfolioPlanner /> : <GridPlanner />}
    </div>
  )
}

function PortfolioPlanner() {
  const [sites, setSites] = useState<SiteRow[]>(INITIAL_SITES)
  const [budget, setBudget] = useState(3_000_000)
  const [objective, setObjective] = useState<PortfolioObjective>('generation')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [importNote, setImportNote] = useState<{ tone: 'green' | 'rose'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const economics = useMemo(() => sites.map(siteEconomics), [sites])
  const result = useMemo(
    () => optimizePortfolio(economics, budget, objective),
    [economics, budget, objective],
  )
  const totalPossible = economics.reduce((s, e) => s + e.capex, 0)

  const update = (id: string, patch: Partial<SiteRow>) =>
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const remove = (id: string) => setSites((prev) => prev.filter((s) => s.id !== id))
  const add = () =>
    setSites((prev) => [
      ...prev,
      { id: nextId(), name: `New site ${prev.length + 1}`, regionId: REGIONS[0].id, capacityKWp: 500 },
    ])

  const selectedById = new Map(result.selections.map((s) => [s.site.id, s]))

  // Portfolio-level cost efficiency (funded build only).
  const portfolioPayback = simplePayback(result.totalCapex, result.totalSavings)
  const portfolioAbatement = abatementCost(result.totalCapex, result.totalCO2Kg)

  // Join each editable row with its economics + efficiency, then sort for display.
  const rows = sites.map((s, i) => {
    const e = economics[i]
    return { site: s, eco: e, eff: siteEfficiency(e) }
  })
  const sortedRows = [...rows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    let cmp: number
    switch (sortKey) {
      case 'name':
        cmp = a.site.name.localeCompare(b.site.name)
        break
      case 'capacity':
        cmp = a.site.capacityKWp - b.site.capacityKWp
        break
      case 'cost':
        cmp = a.eco.capex - b.eco.capex
        break
      case 'generation':
        cmp = a.eco.annualGenerationKWh - b.eco.annualGenerationKWh
        break
      case 'lcoe':
        cmp = a.eff.lcoe - b.eff.lcoe
        break
      case 'abatement':
        cmp = a.eff.abatement - b.eff.abatement
        break
      case 'payback':
        cmp = a.eff.payback - b.eff.payback
        break
    }
    return cmp * dir
  })

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const exportCSV = () => {
    const csv = serializeSitesCSV(
      sites.map((s) => ({ name: s.name, regionId: s.regionId, capacityKWp: s.capacityKWp })),
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'solarwhere-sites.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        const parsed = parseSitesCSV(text)
        if (parsed.length === 0) {
          setImportNote({ tone: 'rose', text: 'No valid rows found in that file.' })
          return
        }
        const imported: SiteRow[] = parsed.map((row) => {
          const region = findRegion(row.regionId)
          return {
            id: nextId(),
            name: row.name,
            // findRegion falls back to a default for unknown ids — pin to first region instead.
            regionId: region.id === row.regionId ? region.id : REGIONS[0].id,
            capacityKWp: Math.max(1, row.capacityKWp),
          }
        })
        setSites(imported)
        setImportNote({ tone: 'green', text: `Imported ${imported.length} site${imported.length === 1 ? '' : 's'}.` })
      } catch {
        setImportNote({ tone: 'rose', text: 'Could not read that file.' })
      }
    }
    reader.onerror = () => setImportNote({ tone: 'rose', text: 'Could not read that file.' })
    reader.readAsText(file)
  }

  const sortIndicator = (key: SortKey) =>
    key === sortKey ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading
          title="Candidate sites"
          subtitle="Add the rooftops, car parks and land you could develop"
          icon="🏗️"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-outline px-3 py-1.5 text-xs" onClick={exportCSV}>Export CSV</button>
              <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>Import CSV</button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(ev) => {
                  const file = ev.target.files?.[0]
                  if (file) importCSV(file)
                  ev.target.value = ''
                }}
              />
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={add}>+ Add site</button>
            </div>
          }
        />
        {importNote && (
          <p className={`mb-2 text-xs ${importNote.tone === 'green' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {importNote.text}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                {PORTFOLIO_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2 pr-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-ink-600"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      <span className="tnum">{sortIndicator(col.key)}</span>
                    </button>
                  </th>
                ))}
                <th className="py-2 pr-3 text-left">Location</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ site: s, eco: e, eff }) => (
                <tr key={s.id} className="border-b border-ink-100">
                  <td className="py-2 pr-3">
                    <input className="input py-1.5" value={s.name} onChange={(ev) => update(s.id, { name: ev.target.value })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input type="number" className="input w-28 py-1.5" value={s.capacityKWp} min={1} onChange={(ev) => update(s.id, { capacityKWp: Math.max(1, parseFloat(ev.target.value) || 0) })} />
                  </td>
                  <td className="py-2 pr-3 tnum text-right text-ink-600">{formatMoney(e.capex)}</td>
                  <td className="py-2 pr-3 tnum text-right text-ink-600">{formatKWh(e.annualGenerationKWh)}</td>
                  <td className="py-2 pr-3 tnum text-right text-ink-600">{formatPerUnit(eff.lcoe)}</td>
                  <td className="py-2 pr-3 tnum text-right text-ink-600">{formatPerUnit(eff.abatement, 0)}</td>
                  <td className="py-2 pr-3 tnum text-right text-ink-600">{formatYears(eff.payback)}</td>
                  <td className="py-2 pr-3">
                    <select className="select py-1.5" value={s.regionId} onChange={(ev) => update(s.id, { regionId: ev.target.value })}>
                      {Object.entries(regionsByCountry()).map(([country, regions]) => (
                        <optgroup key={country} label={country}>
                          {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button className="text-ink-300 hover:text-rose-500" onClick={() => remove(s.id)} aria-label="Remove">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card>
          <SectionHeading title="Optimise allocation" icon="🎚️" />
          <div className="space-y-4">
            <Field label="Capital budget">
              <div className="flex items-center gap-2">
                <input type="number" className="input" value={budget} step={100000} min={0} onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))} />
              </div>
              <div className="mt-2">
                <Slider value={Math.min(budget, totalPossible)} min={0} max={Math.max(totalPossible, 1)} step={50000} onChange={setBudget} format={(v) => formatMoney(v)} />
              </div>
              <p className="mt-1 text-xs text-ink-400">Fully building every site would cost {formatMoney(totalPossible)}.</p>
            </Field>
            <Field label="Maximise for">
              <Segmented
                value={objective}
                onChange={setObjective}
                options={[
                  { value: 'generation', label: 'Energy' },
                  { value: 'co2', label: 'CO₂' },
                  { value: 'roi', label: 'Return' },
                ]}
              />
            </Field>
            <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
              The optimizer ranks sites by {objective === 'generation' ? 'kWh' : objective === 'co2' ? 'CO₂ avoided' : 'savings'} per dollar and funds the best first — the most impact per unit of capital.
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Capacity funded" value={`${formatNumber(result.totalCapacityKWp / 1000, 1)} MW`} accent="solar" />
            <Stat label="Generation/yr" value={formatKWh(result.totalGenerationKWh)} accent="sky" />
            <Stat label="CO₂ avoided/yr" value={formatTonnes(result.totalCO2Kg)} accent="green" />
            <Stat label="Homes powered" value={formatNumber(homesPowered(result.totalGenerationKWh))} />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Savings/yr" value={formatMoney(result.totalSavings)} accent="solar" />
            <Stat label="Blended payback" value={formatYears(portfolioPayback)} sub="capex ÷ annual savings" />
            <Stat label="Avg abatement" value={formatPerUnit(portfolioAbatement, 0)} sub="$/t CO₂ lifetime" accent="green" />
          </div>
          <Card>
            <SectionHeading title="Funding plan" subtitle={`${formatPercent(result.budgetUsedFraction)} of budget deployed`} icon="✅" />
            <div className="space-y-3">
              {economics.map((e) => {
                const sel = selectedById.get(e.id)
                const fraction = sel?.fraction ?? 0
                return (
                  <div key={e.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-800">{e.name}</span>
                      <span className="text-xs text-ink-500">
                        {fraction === 0 ? (
                          <Badge tone="rose">not funded</Badge>
                        ) : fraction < 1 ? (
                          <Badge tone="amber">{formatPercent(fraction)} built</Badge>
                        ) : (
                          <Badge tone="green">fully funded</Badge>
                        )}
                      </span>
                    </div>
                    <div className="mt-1"><ProgressBar value={fraction} tone={fraction >= 1 ? 'green' : 'solar'} /></div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function GridPlanner() {
  const [regionId, setRegionId] = useState('eg-cairo')
  const region = findRegion(regionId)
  const [targetMW, setTargetMW] = useState(100)
  const [hectares, setHectares] = useState(200)
  const [co2Target, setCo2Target] = useState(100_000)

  const profile = useMemo(() => buildIrradianceProfile(region.lat, region.annualGHI), [region])
  const optimal = useMemo(() => findOptimalOrientation(region.lat, profile.monthlyDailyGHI, 0.2), [region, profile])
  const specificYield = optimal.annualPOA * INDICATIVE_PR
  const utilityCostPerWatt = costPerWatt(targetMW * 1000, region.costMultiplier)

  const plan = gridTargetPlan(targetMW, specificYield, utilityCostPerWatt, region.gridCarbonKgPerKWh)

  // "By land" derivation
  const landCapacityKWp = hectaresToCapacity(hectares)
  const landGenerationKWh = landCapacityKWp * specificYield
  const landCapex = landCapacityKWp * 1000 * costPerWatt(landCapacityKWp, region.costMultiplier)

  // "By carbon-reduction target" derivation (inverse plan).
  const co2CapacityKWp = capacityForCO2Target(co2Target, specificYield, region.gridCarbonKgPerKWh)
  const co2Plan = gridTargetPlan(
    co2CapacityKWp / 1000,
    specificYield,
    costPerWatt(co2CapacityKWp, region.costMultiplier),
    region.gridCarbonKgPerKWh,
  )
  const cleanGrid = region.gridCarbonKgPerKWh <= 0

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading title="Region" subtitle="Sets sunlight, cost and grid carbon intensity" icon="🌍" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <select className="select" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              {Object.entries(regionsByCountry()).map(([country, regions]) => (
                <optgroup key={country} label={country}>
                  {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </optgroup>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Yield" value={formatNumber(specificYield)} sub="kWh/kWp" />
            <Stat label="Cost" value={`$${utilityCostPerWatt.toFixed(2)}`} sub="per W" />
            <Stat label="Grid CO₂" value={region.gridCarbonKgPerKWh.toFixed(2)} sub="kg/kWh" />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeading title="By capacity target" subtitle="Size a build-out to a nameplate goal" icon="🎯" />
          <Field label={`Target capacity — ${formatNumber(targetMW)} MW`}>
            <Slider value={targetMW} min={1} max={2000} step={1} onChange={setTargetMW} format={(v) => `${formatNumber(v)} MW`} />
          </Field>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Annual generation" value={`${formatNumber(plan.annualGenerationGWh)} GWh`} accent="sky" />
            <Stat label="Land required" value={`${formatNumber(plan.landHectares)} ha`} sub={`${formatNumber(plan.landKm2, 1)} km²`} />
            <Stat label="Capital cost" value={formatMoney(plan.capex)} accent="solar" />
            <Stat label="Homes powered" value={formatNumber(plan.homesPowered)} accent="green" />
            <Stat label="CO₂ avoided/yr" value={formatTonnes(plan.annualCO2Tonnes * 1000)} accent="green" />
            <Stat label="Density" value={`${KWP_PER_HECTARE / 1000} MW/ha`} sub="fixed-tilt" />
          </div>
        </Card>

        <Card>
          <SectionHeading title="By available land" subtitle="Turn hectares into megawatts" icon="🌾" />
          <Field label={`Land available — ${formatNumber(hectares)} ha`}>
            <Slider value={hectares} min={1} max={5000} step={1} onChange={setHectares} format={(v) => `${formatNumber(v)} ha`} />
          </Field>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Capacity" value={`${formatNumber(landCapacityKWp / 1000, 1)} MW`} accent="solar" />
            <Stat label="Annual generation" value={formatKWh(landGenerationKWh)} accent="sky" />
            <Stat label="Capital cost" value={formatMoney(landCapex)} />
            <Stat label="Homes powered" value={formatNumber(homesPowered(landGenerationKWh))} accent="green" />
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Assumes ~{KWP_PER_HECTARE} kWp/ha for fixed-tilt utility PV (≈1.4 ha per MW). Trackers need more land per MW but yield more per panel.
          </p>
        </Card>
      </div>

      <Card>
        <SectionHeading
          title="By carbon-reduction target"
          subtitle="Work backwards from a CO₂ goal to the build you need"
          icon="🌱"
        />
        <Field label={`Target reduction — ${formatNumber(co2Target)} t CO₂/yr`}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Slider value={co2Target} min={1000} max={2_000_000} step={1000} onChange={setCo2Target} format={(v) => `${formatNumber(v)} t/yr`} />
            </div>
            <input
              type="number"
              className="input w-36"
              value={co2Target}
              min={0}
              step={1000}
              onChange={(e) => setCo2Target(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
        </Field>
        {cleanGrid ? (
          <p className="mt-4 rounded-xl bg-ink-50 p-3 text-sm text-ink-500">
            {region.name}'s grid carbon factor is effectively zero, so adding solar abates almost no grid CO₂ — there's no finite build that meets a carbon-reduction target here. Pick a higher-carbon grid to size one.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Capacity needed" value={`${formatNumber(co2CapacityKWp / 1000, 1)} MW`} accent="solar" />
            <Stat label="Annual generation" value={`${formatNumber(co2Plan.annualGenerationGWh)} GWh`} accent="sky" />
            <Stat label="Land required" value={`${formatNumber(co2Plan.landHectares)} ha`} sub={`${formatNumber(co2Plan.landKm2, 1)} km²`} />
            <Stat label="Capital cost" value={formatMoney(co2Plan.capex)} accent="solar" />
            <Stat label="Homes powered" value={formatNumber(co2Plan.homesPowered)} accent="green" />
            <Stat label="CO₂ avoided/yr" value={formatTonnes(co2Plan.annualCO2Tonnes * 1000)} accent="green" sub="checks against target" />
          </div>
        )}
      </Card>

      <Card className="bg-gradient-to-br from-sky2-50 to-white">
        <SectionHeading title="What this means" icon="💡" />
        <p className="text-sm leading-relaxed text-ink-600">
          A <strong>{formatNumber(targetMW)} MW</strong> solar build in {region.name} would generate about{' '}
          <strong>{formatNumber(plan.annualGenerationGWh)} GWh</strong> per year — enough for roughly{' '}
          <strong>{formatNumber(plan.homesPowered)}</strong> homes — while avoiding{' '}
          <strong>{formatTonnes(plan.annualCO2Tonnes * 1000)}</strong> of CO₂ annually, equivalent to taking{' '}
          <strong>{formatNumber((plan.annualCO2Tonnes * 1000) / 4.6 / 1000)}</strong> thousand cars off the road.
          It needs about <strong>{formatNumber(plan.landKm2, 1)} km²</strong> of land and roughly{' '}
          <strong>{formatMoney(plan.capex)}</strong> of capital at today's costs.
        </p>
      </Card>
    </div>
  )
}
