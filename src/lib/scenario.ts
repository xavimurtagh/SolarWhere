/**
 * Calculator scenario state: a single serialisable object describing every
 * input, plus helpers to persist it (localStorage), share it (URL hash),
 * compare named scenarios, and turn it into engine `BuildParams`.
 *
 * All storage/URL access is guarded so this module is safe to import in
 * non-browser environments (e.g. server-render tests).
 */

import type { BuildParams } from './assess'
import type { SurfaceType } from './solar/types'
import { DEFAULT_PANEL, findPanel } from './data/panels'
import { DEFAULT_REGION, findRegion } from './data/regions'

export interface CalculatorState {
  regionId: string
  surfaceType: SurfaceType
  sizingMode: 'area' | 'capacity'
  areaMode: 'manual' | 'map'
  areaM2: number
  systemSizeKWp: number
  panelId: string
  tiltDeg: number
  azimuthDeg: number
  shadingPct: number
  consumptionMode: 'kwh' | 'bill'
  annualKWh: number
  monthlyBill: number
  daytimeFraction: number
  batteryKWh: number
  // Tariff / finance assumptions
  currency: string
  importPrice: number
  exportPrice: number
  subsidyFraction: number
  discountRate: number
  analysisYears: number
  inflation: number
  albedo: number
  // Financing
  financingMode: 'cash' | 'loan'
  loanApr: number
  loanTermYears: number
  downFraction: number
}

export function defaultState(): CalculatorState {
  const r = DEFAULT_REGION
  return {
    regionId: r.id,
    surfaceType: 'roof-pitched',
    sizingMode: 'area',
    areaMode: 'manual',
    areaM2: 60,
    systemSizeKWp: 5,
    panelId: DEFAULT_PANEL.id,
    tiltDeg: 35,
    azimuthDeg: r.lat >= 0 ? 180 : 0,
    shadingPct: 5,
    consumptionMode: 'kwh',
    annualKWh: 4500,
    monthlyBill: 130,
    daytimeFraction: 0.3,
    batteryKWh: 0,
    currency: r.currency,
    importPrice: r.electricityPrice,
    exportPrice: r.exportPrice,
    subsidyFraction: r.incentiveFraction,
    discountRate: 0.05,
    analysisYears: 25,
    inflation: 0.03,
    albedo: 0.2,
    financingMode: 'cash',
    loanApr: 0.06,
    loanTermYears: 10,
    downFraction: 0.1,
  }
}

/** Merge a partial (e.g. decoded) state onto defaults, dropping unknown keys. */
export function normalizeState(partial: Partial<CalculatorState> | null): CalculatorState {
  const base = defaultState()
  if (!partial) return base
  const out = { ...base }
  for (const key of Object.keys(base) as (keyof CalculatorState)[]) {
    const v = partial[key]
    if (v !== undefined && v !== null && typeof v === typeof base[key]) {
      // @ts-expect-error index assignment of matching-typed value
      out[key] = v
    }
  }
  return out
}

/** Annual consumption implied by the current input mode. */
export function effectiveAnnualKWh(state: CalculatorState): number {
  if (state.consumptionMode === 'bill') {
    if (state.importPrice <= 0) return 0
    return Math.max(0, (state.monthlyBill * 12) / state.importPrice)
  }
  return state.annualKWh
}

/** Convert UI state into engine build parameters. */
export function stateToBuildParams(state: CalculatorState): BuildParams {
  return {
    region: findRegion(state.regionId),
    surfaceType: state.surfaceType,
    areaM2: state.sizingMode === 'area' ? state.areaM2 : undefined,
    systemSizeKWp: state.sizingMode === 'capacity' ? state.systemSizeKWp : undefined,
    orientation: { tiltDeg: state.tiltDeg, azimuthDeg: state.azimuthDeg },
    shadingFraction: state.shadingPct / 100,
    albedo: state.albedo,
    panel: findPanel(state.panelId),
    consumption: {
      annualKWh: effectiveAnnualKWh(state),
      daytimeFraction: state.daytimeFraction,
    },
    batteryKWh: state.batteryKWh,
    tariff: {
      currency: state.currency,
      importPrice: state.importPrice,
      exportPrice: state.exportPrice,
      priceInflationPerYear: state.inflation,
    },
    finance: {
      discountRatePerYear: state.discountRate,
      analysisYears: state.analysisYears,
      upfrontSubsidyFraction: state.subsidyFraction,
    },
  }
}

// ── Encoding / sharing ──────────────────────────────────────────────

export function encodeState(state: CalculatorState): string {
  try {
    return base64UrlEncode(JSON.stringify(state))
  } catch {
    return ''
  }
}

export function decodeState(encoded: string): Partial<CalculatorState> | null {
  try {
    const json = base64UrlDecode(encoded)
    const obj = JSON.parse(json)
    return typeof obj === 'object' && obj ? (obj as Partial<CalculatorState>) : null
  } catch {
    return null
  }
}

function base64UrlEncode(str: string): string {
  const b64 = typeof btoa !== 'undefined' ? btoa(str) : Buffer.from(str, 'utf8').toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8')
}

/** Read a shared state from the URL hash (#s=...), if present. */
export function stateFromUrl(): Partial<CalculatorState> | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  const match = hash.match(/[#&]s=([^&]+)/)
  return match ? decodeState(match[1]) : null
}

export function buildShareUrl(state: CalculatorState): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : ''
  return `${base}#s=${encodeState(state)}`
}

// ── localStorage persistence ────────────────────────────────────────

const LAST_KEY = 'solarwhere:last'
const SCENARIOS_KEY = 'solarwhere:scenarios'

function safeGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}
function safeSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function saveLast(state: CalculatorState): void {
  safeSet(LAST_KEY, JSON.stringify(state))
}
export function loadLast(): Partial<CalculatorState> | null {
  const raw = safeGet(LAST_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Partial<CalculatorState>
  } catch {
    return null
  }
}

export interface SavedScenario {
  id: string
  name: string
  state: CalculatorState
}

export function listScenarios(): SavedScenario[] {
  const raw = safeGet(SCENARIOS_KEY)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as SavedScenario[]) : []
  } catch {
    return []
  }
}

export function saveScenario(name: string, state: CalculatorState, seq: number): SavedScenario[] {
  const scenarios = listScenarios()
  const id = `sc-${seq}`
  const next = [...scenarios.filter((s) => s.name !== name), { id, name, state }]
  safeSet(SCENARIOS_KEY, JSON.stringify(next))
  return next
}

export function deleteScenario(id: string): SavedScenario[] {
  const next = listScenarios().filter((s) => s.id !== id)
  safeSet(SCENARIOS_KEY, JSON.stringify(next))
  return next
}
