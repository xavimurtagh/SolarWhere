/**
 * Installed-cost model.
 *
 * Turn-key $/W falls with system size (economies of scale) and varies by
 * region. Battery $/kWh also falls with size. Values are log-interpolated from
 * representative 2024-era global benchmarks and scaled by a regional
 * multiplier.
 */

/** [systemSizeKWp, $/W turn-key] anchor points (global baseline). */
const COST_PER_WATT_CURVE: [number, number][] = [
  [3, 2.9],
  [5, 2.7],
  [10, 2.4],
  [30, 1.9],
  [100, 1.55],
  [500, 1.2],
  [1000, 1.05],
  [5000, 0.9],
  [20000, 0.8],
]

/** [batteryKWh, $/kWh installed] anchor points. */
const BATTERY_COST_CURVE: [number, number][] = [
  [5, 1000],
  [10, 850],
  [13.5, 800],
  [20, 720],
  [50, 650],
  [200, 550],
  [1000, 480],
]

/** Log–log interpolation over an anchor curve. */
function logInterp(curve: [number, number][], x: number): number {
  const xs = curve.map((c) => c[0])
  if (x <= xs[0]) return curve[0][1]
  if (x >= xs[xs.length - 1]) return curve[curve.length - 1][1]
  for (let i = 0; i < curve.length - 1; i++) {
    const [x0, y0] = curve[i]
    const [x1, y1] = curve[i + 1]
    if (x >= x0 && x <= x1) {
      const t = (Math.log(x) - Math.log(x0)) / (Math.log(x1) - Math.log(x0))
      return Math.exp(Math.log(y0) + t * (Math.log(y1) - Math.log(y0)))
    }
  }
  return curve[curve.length - 1][1]
}

/** Turn-key installed cost, $/W, for a system size and regional multiplier. */
export function costPerWatt(systemSizeKWp: number, regionMultiplier = 1): number {
  return logInterp(COST_PER_WATT_CURVE, Math.max(0.5, systemSizeKWp)) * regionMultiplier
}

/** Total PV hardware + installation capex, $. */
export function systemCapex(
  systemSizeKWp: number,
  regionMultiplier = 1,
  overridePerWatt?: number,
): number {
  const perWatt = overridePerWatt ?? costPerWatt(systemSizeKWp, regionMultiplier)
  return systemSizeKWp * 1000 * perWatt
}

/** Battery installed cost, $/kWh, for a capacity and regional multiplier. */
export function batteryCostPerKWh(batteryKWh: number, regionMultiplier = 1): number {
  if (batteryKWh <= 0) return 0
  return logInterp(BATTERY_COST_CURVE, batteryKWh) * regionMultiplier
}

/** Total battery capex, $. */
export function batteryCapex(
  batteryKWh: number,
  regionMultiplier = 1,
  overridePerKWh?: number,
): number {
  if (batteryKWh <= 0) return 0
  const perKWh = overridePerKWh ?? batteryCostPerKWh(batteryKWh, regionMultiplier)
  return batteryKWh * perKWh
}

/** Inverter replacement cost, $ (a mid-life cost ~$0.13/W). */
export function inverterReplacementCost(
  systemSizeKWp: number,
  regionMultiplier = 1,
): number {
  return systemSizeKWp * 1000 * 0.13 * regionMultiplier
}
