/** Reusable, dependency-free UI primitives styled with Tailwind. */
import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`card card-pad ${className}`}>{children}</div>
}

export function SectionHeading({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && <div className="text-2xl leading-none">{icon}</div>}
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  accent = 'default',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: 'default' | 'solar' | 'green' | 'sky' | 'rose'
}) {
  const accents: Record<string, string> = {
    default: 'text-ink-900',
    solar: 'text-solar-600',
    green: 'text-emerald-600',
    sky: 'text-sky2-600',
    rose: 'text-rose-600',
  }
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${accents[accent]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = '',
  format,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  suffix?: string
  format?: (v: number) => string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-800 tnum">
          {format ? format(value) : `${value}${suffix}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`pill-tab flex-1 whitespace-nowrap ${
            value === opt.value
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'solar' | 'green' | 'sky' | 'rose' | 'amber'
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-600',
    solar: 'bg-solar-100 text-solar-700',
    green: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky2-100 text-sky2-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return <span className={`chip ${tones[tone]}`}>{children}</span>
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-ink-200 text-[10px] font-bold text-ink-600"
    >
      ?
    </span>
  )
}

export function ProgressBar({
  value,
  tone = 'solar',
}: {
  value: number
  tone?: 'solar' | 'green' | 'sky'
}) {
  const tones: Record<string, string> = {
    solar: 'bg-solar-500',
    green: 'bg-emerald-500',
    sky: 'bg-sky2-500',
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className={`h-full rounded-full ${tones[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
      />
    </div>
  )
}
