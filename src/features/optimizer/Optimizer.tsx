import { useMemo, useState } from 'react'
import { DEFAULT_REGION, findRegion, regionsByCountry } from '../../lib/data/regions'
import { buildIrradianceProfile } from '../../lib/solar/irradiance'
import { findOptimalOrientation, transpose } from '../../lib/solar/geometry'
import { azimuthLabel, formatNumber, formatPercent } from '../../lib/format'
import {
  Badge,
  Card,
  Field,
  SectionHeading,
  Slider,
} from '../../components/ui/primitives'
import { SensitivityLine } from '../../components/charts/Charts'

// Indicative performance ratio just for converting POA → kWh/kWp on charts.
const INDICATIVE_PR = 0.82

function colorForFraction(f: number): string {
  if (f >= 0.98) return '#059669'
  if (f >= 0.94) return '#34d399'
  if (f >= 0.88) return '#a3e635'
  if (f >= 0.8) return '#fbbf24'
  if (f >= 0.7) return '#fb923c'
  if (f >= 0.6) return '#f87171'
  return '#fca5a5'
}

export default function Optimizer() {
  const [regionId, setRegionId] = useState(DEFAULT_REGION.id)
  const region = findRegion(regionId)
  const [tiltDeg, setTiltDeg] = useState(35)
  const [azimuthDeg, setAzimuthDeg] = useState(region.lat >= 0 ? 180 : 0)

  const profile = useMemo(
    () => buildIrradianceProfile(region.lat, region.annualGHI),
    [region],
  )
  const optimal = useMemo(
    () => findOptimalOrientation(region.lat, profile.monthlyDailyGHI, 0.2),
    [region, profile],
  )
  const optimalPOA = optimal.annualPOA

  const userPOA = transpose(region.lat, profile.monthlyDailyGHI, tiltDeg, azimuthDeg, 0.2).annualPOA
  const userFraction = optimalPOA > 0 ? userPOA / optimalPOA : 0

  const tiltCurve = useMemo(() => {
    const arr: { tilt: number; yield: number }[] = []
    for (let t = 0; t <= 90; t += 5) {
      const poa = transpose(region.lat, profile.monthlyDailyGHI, t, azimuthDeg, 0.2).annualPOA
      arr.push({ tilt: t, yield: Math.round(poa * INDICATIVE_PR) })
    }
    return arr
  }, [region, profile, azimuthDeg])

  const azimuthCurve = useMemo(() => {
    const arr: { azimuth: number; yield: number }[] = []
    for (let a = 0; a <= 360; a += 15) {
      const poa = transpose(region.lat, profile.monthlyDailyGHI, tiltDeg, a, 0.2).annualPOA
      arr.push({ azimuth: a, yield: Math.round(poa * INDICATIVE_PR) })
    }
    return arr
  }, [region, profile, tiltDeg])

  const cols =
    region.lat >= 0
      ? [
          { label: 'E', deg: 90 },
          { label: 'SE', deg: 135 },
          { label: 'S', deg: 180 },
          { label: 'SW', deg: 225 },
          { label: 'W', deg: 270 },
        ]
      : [
          { label: 'E', deg: 90 },
          { label: 'NE', deg: 45 },
          { label: 'N', deg: 0 },
          { label: 'NW', deg: 315 },
          { label: 'W', deg: 270 },
        ]
  const tiltRows = [0, 10, 20, 30, 45, 60, 75, 90]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">🎯 Generation Optimizer</h1>
        <p className="mt-1 text-ink-500">
          Find the tilt and direction that squeeze the most energy out of your
          location — and see how much you lose by deviating from ideal.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <SectionHeading title="Your array" icon="🧭" />
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
              <Field label={`Tilt — ${formatNumber(tiltDeg)}°`}>
                <Slider value={tiltDeg} min={0} max={90} step={1} onChange={setTiltDeg} suffix="°" />
              </Field>
              <Field label={`Facing — ${azimuthLabel(azimuthDeg)} (${formatNumber(azimuthDeg)}°)`}>
                <Slider value={azimuthDeg} min={0} max={360} step={5} onChange={setAzimuthDeg} format={(v) => `${azimuthLabel(v)} · ${v}°`} />
              </Field>
              <button
                className="btn-primary w-full"
                onClick={() => {
                  setTiltDeg(optimal.tiltDeg)
                  setAzimuthDeg(optimal.azimuthDeg)
                }}
              >
                ✨ Snap to optimal
              </button>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-white">
            <div className="stat-label">Optimal orientation here</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">
              {formatNumber(optimal.tiltDeg)}° · {azimuthLabel(optimal.azimuthDeg)}
            </div>
            <div className="mt-3 stat-label">Your setup captures</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-solar-600">{formatPercent(userFraction)}</span>
              <Badge tone={userFraction >= 0.95 ? 'green' : userFraction >= 0.85 ? 'amber' : 'rose'}>
                of the maximum
              </Badge>
            </div>
            {userFraction < 0.98 && (
              <p className="mt-2 text-xs text-ink-500">
                Reaching ideal would add ~{formatPercent(1 / userFraction - 1)} more output.
              </p>
            )}
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-5">
          <Card>
            <SectionHeading title="Yield vs tilt" subtitle={`Facing ${azimuthLabel(azimuthDeg)} · indicative kWh per kWp/yr`} icon="📐" />
            <SensitivityLine data={tiltCurve} xKey="tilt" yKey="yield" xLabel="Tilt (°)" color="solar" highlightX={tiltDeg} />
          </Card>
          <Card>
            <SectionHeading title="Yield vs direction" subtitle={`At ${formatNumber(tiltDeg)}° tilt · indicative kWh per kWp/yr`} icon="🧭" />
            <SensitivityLine data={azimuthCurve} xKey="azimuth" yKey="yield" xLabel="Azimuth (° from North)" color="sky" highlightX={azimuthDeg} />
          </Card>
        </div>
      </div>

      {/* Heatmap */}
      <Card>
        <SectionHeading title="Tilt × direction map" subtitle="% of the best possible annual yield" icon="🗺️" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="p-1 text-ink-400">tilt ↓ / dir →</th>
                {cols.map((c) => (
                  <th key={c.label} className="p-1 font-semibold text-ink-600">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiltRows.map((t) => (
                <tr key={t}>
                  <td className="p-1 font-semibold text-ink-600">{t}°</td>
                  {cols.map((c) => {
                    const f = transpose(region.lat, profile.monthlyDailyGHI, t, c.deg, 0.2).annualPOA / optimalPOA
                    return (
                      <td
                        key={c.label}
                        className="rounded-md p-2 font-semibold text-ink-900"
                        style={{ backgroundColor: colorForFraction(f) }}
                        title={`${t}° facing ${c.label}: ${formatPercent(f)} of optimal`}
                      >
                        {Math.round(f * 100)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          Greener is better. Notice how output is forgiving near the optimum — being a few degrees off costs very little, but facing away from the equator or lying flat costs a lot.
        </p>
      </Card>

      {/* Tips */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeading title="Maximise generation" subtitle="Beyond orientation" icon="🚀" />
          <ul className="space-y-2.5 text-sm text-ink-600">
            <li>🧭 <strong>Aim at the equator</strong> (south in the north, north in the south) at a tilt near your latitude.</li>
            <li>🌳 <strong>Eliminate shading</strong> — even one shaded cell can drag down a whole string. Trim trees, reposition around chimneys.</li>
            <li>🔌 <strong>Use micro-inverters or power optimizers</strong> on complex or partially-shaded roofs so each panel performs independently.</li>
            <li>🪞 <strong>Bifacial panels</strong> on reflective ground (light gravel, white membrane) can add 5–15%.</li>
            <li>🔄 <strong>Single-axis trackers</strong> on ground mounts lift yield 15–25% by following the sun.</li>
            <li>🧽 <strong>Keep panels clean</strong> — rain does most of it, but dust, pollen, leaves and bird mess add up in dry spells.</li>
          </ul>
        </Card>
        <Card>
          <SectionHeading title="Design choices that matter" subtitle="Get the system right" icon="🛠️" />
          <ul className="space-y-2.5 text-sm text-ink-600">
            <li>⚖️ <strong>Oversize the array vs the inverter</strong> (DC/AC ratio ~1.1–1.3) to harvest more in morning/evening with minimal clipping.</li>
            <li>↔️ <strong>East-west split</strong> on flat roofs flattens the generation curve and fits more panels per roof.</li>
            <li>❄️ <strong>Steeper tilt favours winter</strong> and sheds snow; shallower favours summer. Match to when you use power.</li>
            <li>🌡️ <strong>Ventilate the modules</strong> — cooler panels are more efficient; avoid flush, unventilated mounting in hot climates.</li>
            <li>🔋 <strong>Pair with storage or smart loads</strong> (EV, hot water, heat pump) to use midday surplus instead of exporting it cheaply.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
