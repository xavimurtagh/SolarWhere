/** Display formatting helpers. */

export function formatNumber(n: number, digits = 0): string {
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** Compact money: $1.2k, $3.4M etc. for large figures, exact for small. */
export function formatMoney(n: number, currency = '$', digits = 0): string {
  if (!isFinite(n)) return '—'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 10_000) return `${sign}${currency}${(abs / 1000).toFixed(1)}k`
  return `${sign}${currency}${formatNumber(abs, digits)}`
}

export function formatMoneyExact(n: number, currency = '$'): string {
  if (!isFinite(n)) return '—'
  return `${n < 0 ? '-' : ''}${currency}${formatNumber(Math.abs(n), 0)}`
}

export function formatKWh(n: number): string {
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} GWh`
  if (n >= 10_000) return `${(n / 1000).toFixed(1)} MWh`
  return `${formatNumber(n)} kWh`
}

export function formatPercent(fraction: number, digits = 0): string {
  if (!isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(digits)}%`
}

export function formatYears(n: number): string {
  if (!isFinite(n)) return 'never'
  return `${n.toFixed(1)} yr`
}

/** Compass azimuth → cardinal label. */
export function azimuthLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const idx = Math.round(((deg % 360) / 45)) % 8
  return dirs[idx]
}

export function formatTonnes(kg: number): string {
  if (!isFinite(kg)) return '—'
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} kt`
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`
  return `${formatNumber(kg)} kg`
}
