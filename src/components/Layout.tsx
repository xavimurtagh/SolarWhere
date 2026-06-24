import type { ReactNode } from 'react'
import { NAV_ITEMS, type Section } from '../lib/nav'

export function Layout({
  current,
  onNavigate,
  children,
}: {
  current: Section
  onNavigate: (s: Section) => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5"
              aria-label="SolarWhere home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-solar-400 to-solar-600 text-lg shadow-sm">
                ☀️
              </span>
              <div className="text-left leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-ink-900">
                  Solar<span className="text-solar-500">Where</span>
                </div>
                <div className="-mt-0.5 text-[11px] font-medium text-ink-400">
                  Plan · Estimate · Optimise
                </div>
              </div>
            </button>
            <a
              href="https://www.energy.gov/eere/solar/homeowners-guide-going-solar"
              target="_blank"
              rel="noreferrer"
              className="hidden text-xs font-medium text-ink-400 hover:text-ink-600 sm:block"
            >
              Estimates only · verify with local quotes
            </a>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`pill-tab flex items-center gap-1.5 ${
                  current === item.id
                    ? 'bg-solar-100 text-solar-700'
                    : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-solar-400 to-solar-600 text-base">
                ☀️
              </span>
              <span className="font-bold text-ink-800">
                Solar<span className="text-solar-500">Where</span>
              </span>
            </div>
            <p className="max-w-xl text-xs leading-relaxed text-ink-400">
              SolarWhere produces independent planning estimates from
              physically-grounded models and representative regional data. Real
              results vary with weather, tariffs, hardware and installation
              quality. Always obtain certified local quotes before investing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
