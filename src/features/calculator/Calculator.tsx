import { useEffect, useMemo, useState } from 'react'
import { runAssessment } from '../../lib/assess'
import {
  DEFAULT_REGION,
  findRegion,
  regionsByCountry,
} from '../../lib/data/regions'
import { DEFAULT_PANEL, PANELS, findPanel } from '../../lib/data/panels'
import { SURFACE_TYPES } from '../../lib/solar/system'
import { BATTERY_SIZES, suggestBatterySize } from '../../lib/solar/battery'
import type { SurfaceType } from '../../lib/solar/types'
import { azimuthLabel, formatNumber } from '../../lib/format'
import {
  Badge,
  Card,
  Field,
  SectionHeading,
  Segmented,
  Slider,
} from '../../components/ui/primitives'
import { MapAreaPicker } from '../../components/MapAreaPicker'
import { ResultsDashboard } from './ResultsDashboard'

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

export default function Calculator() {
  const [regionId, setRegionId] = useState(DEFAULT_REGION.id)
  const region = findRegion(regionId)

  const [surfaceType, setSurfaceType] = useState<SurfaceType>('roof-pitched')
  const [sizingMode, setSizingMode] = useState<'area' | 'capacity'>('area')
  const [areaMode, setAreaMode] = useState<'manual' | 'map'>('manual')
  const [areaM2, setAreaM2] = useState(60)
  const [systemSizeKWp, setSystemSizeKWp] = useState(5)
  const [panelId, setPanelId] = useState(DEFAULT_PANEL.id)

  const [tiltDeg, setTiltDeg] = useState(35)
  const [azimuthDeg, setAzimuthDeg] = useState(180)
  const [shadingPct, setShadingPct] = useState(5)

  const [annualKWh, setAnnualKWh] = useState(4500)
  const [daytimeFraction, setDaytimeFraction] = useState(0.3)
  const [batteryKWh, setBatteryKWh] = useState(0)

  // Advanced assumptions (initialised from region; reset when region changes).
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [importPrice, setImportPrice] = useState(region.electricityPrice)
  const [exportPrice, setExportPrice] = useState(region.exportPrice)
  const [subsidyFraction, setSubsidyFraction] = useState(region.incentiveFraction)
  const [discountRate, setDiscountRate] = useState(0.05)
  const [analysisYears, setAnalysisYears] = useState(25)
  const [inflation, setInflation] = useState(0.03)
  const [albedo, setAlbedo] = useState(0.2)

  // When region changes, refresh price/incentive assumptions to its defaults.
  useEffect(() => {
    setImportPrice(region.electricityPrice)
    setExportPrice(region.exportPrice)
    setSubsidyFraction(region.incentiveFraction)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId])

  // When surface changes, snap tilt to a sensible default for it.
  useEffect(() => {
    const meta = SURFACE_TYPES.find((s) => s.type === surfaceType)
    if (meta) setTiltDeg(meta.defaultTilt)
    if (surfaceType === 'ground-field') {
      setSizingMode('area')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceType])

  const result = useMemo(
    () =>
      runAssessment({
        region,
        surfaceType,
        areaM2: sizingMode === 'area' ? areaM2 : undefined,
        systemSizeKWp: sizingMode === 'capacity' ? systemSizeKWp : undefined,
        orientation: { tiltDeg, azimuthDeg },
        shadingFraction: shadingPct / 100,
        albedo,
        panel: findPanel(panelId),
        consumption: { annualKWh, daytimeFraction },
        batteryKWh,
        tariff: { importPrice, exportPrice, priceInflationPerYear: inflation },
        finance: {
          discountRatePerYear: discountRate,
          analysisYears,
          upfrontSubsidyFraction: subsidyFraction,
        },
      }),
    [region, surfaceType, sizingMode, areaM2, systemSizeKWp, tiltDeg, azimuthDeg, shadingPct, albedo, panelId, annualKWh, daytimeFraction, batteryKWh, importPrice, exportPrice, inflation, discountRate, analysisYears, subsidyFraction],
  )

  const grouped = regionsByCountry()
  const suggestedBattery = suggestBatterySize(
    result.generation.annualGenerationKWh,
    { annualKWh, daytimeFraction },
  )

  return (
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
      {/* ── Inputs ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <Card>
          <SectionHeading title="Your site" subtitle="Location sets sun, prices & policy" icon="📍" />
          <div className="space-y-4">
            <Field label="Location / climate">
              <select className="select" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                {Object.entries(grouped).map(([country, regions]) => (
                  <optgroup key={country} label={country}>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Sun" value={`${formatNumber(region.annualGHI)}`} unit="kWh/m²/yr" />
              <MiniStat label="Price" value={`${region.currency}${region.electricityPrice.toFixed(2)}`} unit="per kWh" />
              <MiniStat label="Grid CO₂" value={`${region.gridCarbonKgPerKWh.toFixed(2)}`} unit="kg/kWh" />
            </div>
            {region.incentiveNote && (
              <p className="rounded-lg bg-solar-50 px-3 py-2 text-xs text-solar-800">
                🎁 {region.incentiveNote}
              </p>
            )}

            <Field label="Mounting surface">
              <div className="grid grid-cols-2 gap-2">
                {SURFACE_TYPES.map((s) => (
                  <button
                    key={s.type}
                    onClick={() => setSurfaceType(s.type)}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      surfaceType === s.type
                        ? 'border-solar-400 bg-solar-50'
                        : 'border-ink-200 bg-white hover:border-ink-300'
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
              value={sizingMode}
              onChange={(v) => setSizingMode(v)}
              options={[
                { value: 'area', label: 'By area' },
                { value: 'capacity', label: 'By capacity' },
              ]}
            />

            {sizingMode === 'area' ? (
              <>
                <Segmented
                  value={areaMode}
                  onChange={(v) => setAreaMode(v)}
                  options={[
                    { value: 'manual', label: 'Enter area' },
                    { value: 'map', label: 'Draw on map' },
                  ]}
                />
                {areaMode === 'manual' ? (
                  <Field label="Available area" hint="Gross roof or land area to cover">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="input"
                        value={areaM2}
                        min={1}
                        onChange={(e) => setAreaM2(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      <span className="text-sm text-ink-500">m²</span>
                    </div>
                    <div className="mt-2">
                      <Slider value={areaM2} min={5} max={surfaceType === 'ground-field' ? 50000 : 400} step={5} onChange={setAreaM2} suffix=" m²" />
                    </div>
                  </Field>
                ) : (
                  <MapAreaPicker
                    center={[region.lat, region.lon]}
                    onAreaChange={(a) => {
                      if (a > 0) setAreaM2(a)
                    }}
                  />
                )}
              </>
            ) : (
              <Field label="System capacity">
                <Slider value={systemSizeKWp} min={1} max={surfaceType === 'ground-field' ? 5000 : 30} step={surfaceType === 'ground-field' ? 25 : 0.5} onChange={setSystemSizeKWp} format={(v) => `${formatNumber(v, 1)} kWp`} />
              </Field>
            )}

            <Field label="Panel type">
              <select className="select" value={panelId} onChange={(e) => setPanelId(e.target.value)}>
                {PANELS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {(p.efficiency * 100).toFixed(1)}%
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 p-3">
              <Badge tone="solar">{formatNumber(result.sizing.systemSizeKWp, 1)} kWp</Badge>
              <Badge>{result.sizing.panelCount} panels</Badge>
              {sizingMode === 'capacity' && <Badge>~{formatNumber(result.sizing.grossAreaM2)} m² needed</Badge>}
              {sizingMode === 'area' && <Badge>{formatNumber(result.sizing.moduleAreaM2)} m² of panels</Badge>}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading title="Orientation & shading" subtitle="Tilt, direction & obstructions" icon="🧭" />
          <div className="space-y-4">
            <Field label={`Tilt — ${formatNumber(tiltDeg)}° from horizontal`}>
              <Slider value={tiltDeg} min={0} max={90} step={1} onChange={setTiltDeg} suffix="°" />
            </Field>
            <Field label={`Facing — ${azimuthLabel(azimuthDeg)} (${formatNumber(azimuthDeg)}°)`}>
              <Slider value={azimuthDeg} min={0} max={360} step={5} onChange={setAzimuthDeg} format={(v) => `${azimuthLabel(v)} · ${v}°`} />
              <div className="mt-2 flex gap-2">
                {AZIMUTH_PRESETS.map((a) => (
                  <button key={a.label} onClick={() => setAzimuthDeg(a.deg)} className="btn-outline flex-1 px-2 py-1 text-xs">
                    {a.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setTiltDeg(result.optimalOrientation.tiltDeg)
                    setAzimuthDeg(result.optimalOrientation.azimuthDeg)
                  }}
                  className="btn-primary px-2 py-1 text-xs"
                >
                  ✨ Optimal
                </button>
              </div>
            </Field>
            <Field label={`Shading loss — ${formatNumber(shadingPct)}%`} hint="Trees, chimneys, nearby buildings">
              <Slider value={shadingPct} min={0} max={60} step={1} onChange={setShadingPct} suffix="%" />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionHeading title="Energy use & storage" subtitle="Your demand and battery" icon="⚡" />
          <div className="space-y-4">
            <Field label="Usage profile">
              <div className="grid grid-cols-2 gap-2">
                {USAGE_PRESETS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setAnnualKWh(u.annualKWh)
                      setDaytimeFraction(u.daytime)
                    }}
                    className={`rounded-xl border p-2 text-xs transition ${
                      annualKWh === u.annualKWh
                        ? 'border-sky2-400 bg-sky2-50'
                        : 'border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    <div className="font-semibold text-ink-800">{u.label}</div>
                    <div className="text-ink-400">{formatNumber(u.annualKWh)} kWh/yr</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Annual consumption" hint="Find this on your electricity bill">
              <div className="flex items-center gap-2">
                <input type="number" className="input" value={annualKWh} min={0} onChange={(e) => setAnnualKWh(Math.max(0, parseFloat(e.target.value) || 0))} />
                <span className="text-sm text-ink-500">kWh/yr</span>
              </div>
            </Field>
            <Field label="Battery storage">
              <div className="flex flex-wrap gap-2">
                {BATTERY_SIZES.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBatteryKWh(b)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      batteryKWh === b ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
                    }`}
                  >
                    {b === 0 ? 'None' : `${b} kWh`}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-400">
                💡 Suggested for this system: <strong>{suggestedBattery} kWh</strong>. See the Battery Advisor for payback.
              </p>
            </Field>
          </div>
        </Card>

        <Card>
          <button className="flex w-full items-center justify-between" onClick={() => setShowAdvanced((s) => !s)}>
            <span className="section-title">Advanced assumptions</span>
            <span className="text-ink-400">{showAdvanced ? '▲' : '▼'}</span>
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Import price">
                  <input type="number" step={0.01} className="input" value={importPrice} onChange={(e) => setImportPrice(parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Export price">
                  <input type="number" step={0.01} className="input" value={exportPrice} onChange={(e) => setExportPrice(parseFloat(e.target.value) || 0)} />
                </Field>
              </div>
              <Field label={`Up-front incentive — ${formatNumber(subsidyFraction * 100)}% of cost`}>
                <Slider value={subsidyFraction * 100} min={0} max={60} step={1} onChange={(v) => setSubsidyFraction(v / 100)} suffix="%" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`Daytime use ${formatNumber(daytimeFraction * 100)}%`}>
                  <Slider value={daytimeFraction * 100} min={5} max={95} step={5} onChange={(v) => setDaytimeFraction(v / 100)} suffix="%" />
                </Field>
                <Field label={`Price inflation ${formatNumber(inflation * 100)}%`}>
                  <Slider value={inflation * 100} min={0} max={8} step={0.5} onChange={(v) => setInflation(v / 100)} suffix="%" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`Discount rate ${formatNumber(discountRate * 100)}%`}>
                  <Slider value={discountRate * 100} min={0} max={12} step={0.5} onChange={(v) => setDiscountRate(v / 100)} suffix="%" />
                </Field>
                <Field label={`Horizon ${analysisYears} yr`}>
                  <Slider value={analysisYears} min={10} max={30} step={1} onChange={setAnalysisYears} suffix=" yr" />
                </Field>
              </div>
              <Field label={`Ground reflectance (albedo) ${albedo.toFixed(2)}`} hint="Grass 0.2 · concrete 0.3 · snow 0.6">
                <Slider value={albedo * 100} min={10} max={70} step={5} onChange={(v) => setAlbedo(v / 100)} suffix="%" />
              </Field>
            </div>
          )}
        </Card>
      </div>

      {/* ── Results ────────────────────────────────────────── */}
      <div>
        <ResultsDashboard result={result} />
      </div>
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
