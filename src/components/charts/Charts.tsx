/** Recharts-based visual components for the dashboards. */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MONTH_LABELS } from '../../lib/solar/geometry'
import { formatKWh, formatMoney, formatNumber } from '../../lib/format'

const COLORS = {
  solar: '#f59e0b',
  sky: '#06b6d4',
  green: '#10b981',
  rose: '#f43f5e',
  ink: '#94a3b8',
  grid: '#e2e8f0',
}

const axisStyle = { fontSize: 11, fill: '#64748b' }

export function MonthlyGenerationChart({
  monthly,
  monthlyConsumption,
}: {
  monthly: number[]
  monthlyConsumption?: number[]
}) {
  const data = monthly.map((g, i) => ({
    month: MONTH_LABELS[i],
    generation: Math.round(g),
    consumption: monthlyConsumption ? Math.round(monthlyConsumption[i]) : undefined,
  }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          formatter={(v: number) => formatKWh(v)}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        {monthlyConsumption && <Legend wrapperStyle={{ fontSize: 12 }} />}
        <Bar dataKey="generation" name="Solar generation" fill={COLORS.solar} radius={[4, 4, 0, 0]} />
        {monthlyConsumption && (
          <Line
            type="monotone"
            dataKey="consumption"
            name="Consumption"
            stroke={COLORS.sky}
            strokeWidth={2}
            dot={false}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

export interface DonutSlice {
  name: string
  value: number
  color: keyof typeof COLORS
}

export function Donut({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[]
  centerLabel?: string
  centerValue?: string
}) {
  const data = slices.filter((s) => s.value > 0)
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((s) => (
              <Cell key={s.name} fill={COLORS[s.color]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatKWh(v)}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <div className="text-xl font-bold text-ink-900 tnum">{centerValue}</div>}
          {centerLabel && <div className="text-[11px] uppercase tracking-wide text-ink-400">{centerLabel}</div>}
        </div>
      )}
    </div>
  )
}

export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {slices
        .filter((s) => s.value > 0)
        .map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[s.color] }} />
            {s.name} · {formatKWh(s.value)}
          </div>
        ))}
    </div>
  )
}

export function CashflowChart({
  cashflow,
  currency,
  paybackYears,
}: {
  cashflow: { year: number; cumulative: number }[]
  currency: string
  paybackYears: number
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={cashflow} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => formatMoney(v, currency)}
        />
        <Tooltip
          formatter={(v: number) => [formatMoney(v, currency), 'Cumulative']}
          labelFormatter={(l) => `Year ${l}`}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <ReferenceLine y={0} stroke={COLORS.ink} strokeWidth={1} />
        {isFinite(paybackYears) && (
          <ReferenceLine
            x={Math.round(paybackYears)}
            stroke={COLORS.solar}
            strokeDasharray="4 4"
            label={{ value: 'Payback', fontSize: 11, fill: '#b45309', position: 'insideTopRight' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={COLORS.green}
          strokeWidth={2}
          fill="url(#cf)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Generic small line chart for sensitivity curves (e.g. tilt vs yield). */
export function SensitivityLine({
  data,
  xKey,
  yKey,
  xLabel,
  color = 'solar',
  highlightX,
}: {
  data: Record<string, number>[]
  xKey: string
  yKey: string
  xLabel?: string
  color?: keyof typeof COLORS
  highlightX?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          label={xLabel ? { value: xLabel, fontSize: 11, fill: '#94a3b8', position: 'insideBottom', dy: 10 } : undefined}
        />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          formatter={(v: number) => formatNumber(v)}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        {highlightX != null && (
          <ReferenceLine x={highlightX} stroke={COLORS.green} strokeDasharray="4 4" />
        )}
        <Line type="monotone" dataKey={yKey} stroke={COLORS[color]} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
