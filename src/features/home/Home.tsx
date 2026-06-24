import { NAV_ITEMS, type Section } from '../../lib/nav'
import { Card } from '../../components/ui/primitives'
import { REGIONS } from '../../lib/data/regions'

export default function Home({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const tools = NAV_ITEMS.filter((n) => n.id !== 'home')

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="max-w-3xl">
          <span className="chip bg-white/10 text-solar-200">☀️ Solar planning, end to end</span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Know exactly what solar will do for{' '}
            <span className="text-solar-400">your</span> roof, field or portfolio.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-200 sm:text-lg">
            SolarWhere turns a location and a bit of information into a complete,
            physically-grounded picture: how much to install, what you'll
            generate, what you'll save, whether a battery pays off, how to
            squeeze out every extra kilowatt-hour — and, for organisations, how
            to plan solar at the scale of cities and grids.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('calculator')} className="btn-primary px-5 py-3 text-base">
              🧮 Start the calculator
            </button>
            <button onClick={() => onNavigate('guide')} className="btn px-5 py-3 text-base bg-white/10 text-white hover:bg-white/20">
              📘 Read the guide
            </button>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
            <HeroStat value={`${REGIONS.length}+`} label="regions modelled" />
            <HeroStat value="25-yr" label="financial horizon" />
            <HeroStat value="kWp→GW" label="home to grid scale" />
          </div>
        </div>
      </section>

      {/* Tools */}
      <section>
        <h2 className="mb-1 text-2xl font-bold text-ink-900">Everything you need, in one place</h2>
        <p className="mb-5 text-ink-500">Five tools that take you from "should I?" to "here's the plan."</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <button key={t.id} onClick={() => onNavigate(t.id)} className="text-left">
              <Card className="h-full transition hover:shadow-lift hover:-translate-y-0.5">
                <div className="text-3xl">{t.icon}</div>
                <h3 className="mt-3 text-lg font-bold text-ink-900">{t.label}</h3>
                <p className="mt-1 text-sm text-ink-500">{t.blurb}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-solar-600">Open →</span>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-5 text-2xl font-bold text-ink-900">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard n={1} title="Describe your site" body="Pick your location, draw your roof or field on the map (or enter the area), and tell us how you use energy." />
          <StepCard n={2} title="See the full picture" body="Generation, bill savings, payback, battery value, carbon avoided and orientation efficiency — instantly, with charts." />
          <StepCard n={3} title="Optimise & act" body="Tune tilt and direction for maximum output, decide on storage, then take a confident plan to certified installers." />
        </div>
      </section>

      {/* Science note */}
      <section>
        <Card className="bg-gradient-to-br from-sky2-50 to-white">
          <h2 className="text-xl font-bold text-ink-900">Built on real solar physics</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">
            Estimates come from an irradiance-transposition model (solar
            geometry, the Erbs diffuse correlation and an isotropic sky model),
            a temperature-aware performance ratio, year-on-year degradation, an
            energy-conserving self-consumption and battery model, and a full
            financial appraisal (payback, NPV, IRR and LCOE). Regional defaults
            cover sunlight, electricity prices, grid carbon intensity, install
            costs and incentives — all editable.
          </p>
        </Card>
      </section>
    </div>
  )
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-solar-400">{value}</div>
      <div className="text-xs text-ink-300">{label}</div>
    </div>
  )
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <Card className="h-full">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-solar-100 font-bold text-solar-700">{n}</div>
      <h3 className="mt-3 font-bold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm text-ink-500">{body}</p>
    </Card>
  )
}
