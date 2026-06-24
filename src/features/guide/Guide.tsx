/**
 * Guide.tsx — A comprehensive, content-rich educational guide for anyone
 * considering installing solar PV. Self-contained: only imports from 'react'
 * and the shared UI primitives. Styled with the project's Tailwind conventions.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Card, SectionHeading, Badge } from '../../components/ui/primitives'

/* ------------------------------------------------------------------ */
/* Local helper components                                            */
/* ------------------------------------------------------------------ */

type CalloutTone = 'solar' | 'green' | 'sky' | 'rose' | 'amber' | 'ink'

/** Tinted, left-bordered callout box for tips / warnings / notes. */
function Callout({
  tone = 'sky',
  icon,
  title,
  children,
}: {
  tone?: CalloutTone
  icon?: ReactNode
  title?: string
  children: ReactNode
}) {
  const tones: Record<CalloutTone, string> = {
    solar: 'border-solar-400 bg-solar-50 text-solar-900',
    green: 'border-emerald-400 bg-emerald-50 text-emerald-900',
    sky: 'border-sky2-400 bg-sky2-50 text-sky2-900',
    rose: 'border-rose-400 bg-rose-50 text-rose-900',
    amber: 'border-amber-400 bg-amber-50 text-amber-900',
    ink: 'border-ink-300 bg-ink-50 text-ink-800',
  }
  return (
    <div className={`rounded-xl border-l-4 p-4 ${tones[tone]}`}>
      {title && (
        <p className="mb-1 flex items-center gap-2 font-semibold">
          {icon && <span className="text-lg leading-none">{icon}</span>}
          {title}
        </p>
      )}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

/** A single anchored section with consistent spacing + scroll offset. */
function Section({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      {children}
    </section>
  )
}

/** Numbered step used in the process / sizing walkthroughs. */
function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: ReactNode
}) {
  return (
    <li className="flex gap-4">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-solar-500 text-sm font-bold text-white tnum">
        {n}
      </div>
      <div className="pt-1">
        <p className="font-semibold text-ink-900">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-ink-700">{children}</div>
      </div>
    </li>
  )
}

/** Compact key/value row used in the glossary. */
function Term({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="border-b border-ink-100 py-3 last:border-b-0">
      <dt className="font-semibold text-ink-900">{term}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-ink-700">{children}</dd>
    </div>
  )
}

/** Generic bordered table wrapper for horizontal scroll on mobile. */
function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Static data                                                        */
/* ------------------------------------------------------------------ */

interface TocItem {
  id: string
  label: string
  icon: string
}

const TOC: TocItem[] = [
  { id: 'how-it-works', label: 'How solar PV works', icon: '☀️' },
  { id: 'suitability', label: 'Is your property suitable?', icon: '🏠' },
  { id: 'sizing', label: 'Sizing your system', icon: '📐' },
  { id: 'costs', label: 'Understanding costs', icon: '💷' },
  { id: 'financing', label: 'Financing & incentives', icon: '🏦' },
  { id: 'batteries', label: 'Batteries & storage', icon: '🔋' },
  { id: 'maximising', label: 'Maximising generation', icon: '📈' },
  { id: 'installation', label: 'The installation process', icon: '🛠️' },
  { id: 'maintenance', label: 'Maintenance', icon: '🧰' },
  { id: 'lifespan', label: 'Lifespan & degradation', icon: '♻️' },
  { id: 'mistakes', label: 'Common mistakes', icon: '⚠️' },
  { id: 'faq', label: 'FAQ', icon: '❓' },
  { id: 'glossary', label: 'Glossary', icon: '📖' },
]

interface Faq {
  q: string
  a: ReactNode
}

const FAQS: Faq[] = [
  {
    q: 'Do solar panels work in winter or on cloudy days?',
    a: (
      <>
        Yes — just less. Panels respond to <em>light</em>, not heat, so they keep
        producing under cloud, typically at roughly 10–25% of their clear-sky
        output depending on cloud thickness. Output drops in winter because days
        are shorter and the sun sits lower, but a UK system might still make
        15–25% of its summer daily yield in December. Annual figures already bake
        in this seasonal swing, so a year-round average is what matters for
        payback.
      </>
    ),
  },
  {
    q: 'Will my panels keep the lights on during a power cut?',
    a: (
      <>
        Not by default. For safety, a standard grid-tied inverter shuts down the
        moment the grid goes dead (called <em>anti-islanding</em>) so it cannot
        back-feed electricity onto lines that engineers may be repairing. To keep
        power during an outage you need a battery plus a hybrid or backup-capable
        inverter with a changeover device that isolates your home from the grid.
        Ask specifically for &ldquo;backup&rdquo; or &ldquo;EPS&rdquo; (Emergency
        Power Supply) — many basic battery setups do <strong>not</strong> include
        it.
      </>
    ),
  },
  {
    q: 'Will the installation damage my roof or cause leaks?',
    a: (
      <>
        A competent installation should not. Mounting feet are flashed and sealed
        into the roof structure, attaching to rafters rather than just the tiles.
        Most roof problems trace back to poor workmanship, so choosing an
        accredited, insured installer is the best protection. Reputable installers
        warrant their workmanship (often 2–10 years) and will inspect your roof&apos;s
        condition before quoting.
      </>
    ),
  },
  {
    q: 'Do I need planning permission or permits?',
    a: (
      <>
        It depends on where you live. In much of the UK, roof-mounted domestic
        solar is &ldquo;permitted development&rdquo; (no planning application) as
        long as it does not project too far and you are not in a conservation area
        or listed building. In the US you almost always need a building/electrical
        permit and utility interconnection approval. Australia requires network
        approval and a CEC-accredited installer. Always confirm: conservation
        areas, flats, heritage sites and ground-mounts have stricter rules.
      </>
    ),
  },
  {
    q: 'What happens to my system when I sell the home?',
    a: (
      <>
        If you own the system outright it transfers with the property and several
        studies suggest it can modestly raise sale value and speed up the sale.
        Keep all paperwork — warranties, certificates (e.g. MCS/SEG in the UK),
        commissioning report and monitoring logins — for the buyer. If the system
        is on a <em>lease or PPA</em>, the contract must be transferred or bought
        out, which can complicate a sale, so read those terms before signing.
      </>
    ),
  },
  {
    q: 'Can panels survive hail, storms and high winds?',
    a: (
      <>
        Modern panels are tested to withstand hailstones around 25 mm hitting at
        ~80 km/h, and mounting systems are engineered to local wind loads. Damage
        is uncommon but not impossible in extreme events — which is why panels
        should be declared on your home insurance (often at little or no extra
        cost). After a severe storm, a quick visual check and a glance at your
        monitoring app will flag any cracked glass or under-performing strings.
      </>
    ),
  },
  {
    q: 'Will I still get an electricity bill?',
    a: (
      <>
        Almost certainly yes, just a smaller one. Unless you go fully off-grid
        (rare and expensive), you stay connected and draw from the grid at night
        and during low-generation periods. You will also keep paying any fixed
        daily standing charge. The savings come from buying less imported
        electricity plus any credit you earn for exported surplus.
      </>
    ),
  },
  {
    q: 'How long until the system pays for itself?',
    a: (
      <>
        For a typical owner-occupied home, simple payback is commonly in the
        ~6–12 year range, after which the electricity is effectively very cheap
        for the remaining 15+ years of panel life. Payback is faster when
        electricity prices are high, when you use a large share of your own
        generation, and where incentives are generous. A battery usually lengthens
        payback, so add it for resilience or self-sufficiency, not purely for ROI.
      </>
    ),
  },
  {
    q: 'Do panels need a sunny climate to be worthwhile?',
    a: (
      <>
        No. Germany and the UK are among the largest solar markets in the world
        despite modest sunshine, because what matters is the economics: the price
        you pay for grid power versus the cost of generating your own. Cloudier
        regions simply need a slightly larger array to hit the same annual output
        as a sunnier one.
      </>
    ),
  },
  {
    q: 'Can I add a battery or more panels later?',
    a: (
      <>
        Often yes, and many people do. The easiest path is to plan ahead: choose a
        hybrid (battery-ready) inverter and leave roof space and cable routes for
        expansion. Retrofitting is still possible later but may need an extra
        inverter, additional approvals, or AC-coupling a battery to an existing
        array. Tell your installer your future plans at the design stage.
      </>
    ),
  },
]

interface GlossaryEntry {
  term: string
  def: ReactNode
}

const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'kWp (kilowatt-peak)',
    def: 'The rated DC output of a system under standard test conditions (1,000 W/m², 25 °C). It describes the size/capacity of an array, not how much it makes in a year.',
  },
  {
    term: 'kWh (kilowatt-hour)',
    def: 'A unit of energy — 1 kW used for 1 hour. Your bills and your annual generation are measured in kWh. A UK home uses roughly 2,700–4,000 kWh/year.',
  },
  {
    term: 'Inverter',
    def: 'The device that converts the DC electricity from panels into the AC electricity your home and grid use. The brain of the system and the part most likely to need replacing.',
  },
  {
    term: 'String inverter',
    def: 'A single central inverter wired to a series ("string") of panels. Cost-effective, but shading or a fault on one panel can drag down the whole string.',
  },
  {
    term: 'Microinverter',
    def: 'A small inverter mounted on each panel, so panels operate independently. Better for shaded/complex roofs and panel-level monitoring, at higher cost.',
  },
  {
    term: 'Power optimizer',
    def: 'A panel-level DC device paired with a string inverter. Recovers much of the shade tolerance and monitoring of microinverters while keeping one central inverter.',
  },
  {
    term: 'Azimuth',
    def: 'The compass direction a panel faces. Equator-facing is ideal — due south in the Northern Hemisphere, due north in the Southern Hemisphere.',
  },
  {
    term: 'Tilt',
    def: 'The angle of the panel from horizontal. A tilt roughly equal to your latitude maximises annual yield; flatter favours summer, steeper favours winter.',
  },
  {
    term: 'Peak sun hours',
    def: 'The number of hours per day that sunlight averages 1,000 W/m². A handy multiplier: kWp × peak sun hours × performance ratio ≈ daily kWh.',
  },
  {
    term: 'Performance ratio (PR)',
    def: 'Actual output divided by theoretical output — a quality/efficiency score. Good modern systems achieve ~0.75–0.85 after losses from heat, wiring, inverter and soiling.',
  },
  {
    term: 'LCOE (Levelised Cost of Energy)',
    def: 'The lifetime cost of the system divided by the lifetime energy it produces, giving a per-kWh price. Useful for comparing self-generation against grid tariffs.',
  },
  {
    term: 'Net metering',
    def: 'A billing scheme where exported units offset imported units at (or near) the retail rate — effectively using the grid as a battery. Common in parts of the US and India.',
  },
  {
    term: 'Feed-in / export tariff',
    def: 'A payment for electricity you export to the grid. In the UK this is the Smart Export Guarantee (SEG); rates vary widely by supplier and are usually below the import price.',
  },
  {
    term: 'Self-consumption',
    def: 'The share of your generation you use yourself rather than export. Because self-used power offsets expensive imports, raising self-consumption usually improves returns.',
  },
  {
    term: 'DC/AC ratio (overbuild)',
    def: 'The ratio of array DC capacity to inverter AC capacity. Ratios of ~1.1–1.3 are common: a little "clipping" at peak is outweighed by more energy in weak light.',
  },
  {
    term: 'Degradation',
    def: 'The gradual decline in panel output over time, typically ~0.4–0.6% per year, so a panel may still make ~85–90% of its original output after 25 years.',
  },
  {
    term: 'Bifacial panel',
    def: 'A panel that also captures light on its rear from ground-reflected sunlight (albedo). Can add a few percent to over 10% with a reflective surface and good mounting.',
  },
  {
    term: 'NOCT (Nominal Operating Cell Temperature)',
    def: 'A more realistic rating than STC, measured at 800 W/m² and 20 °C ambient. It reflects that panels run hot in the field, which slightly lowers real-world output.',
  },
]

/* ------------------------------------------------------------------ */
/* Flow diagram (panel → inverter → home → grid)                     */
/* ------------------------------------------------------------------ */

function FlowNode({
  icon,
  label,
  sub,
  tone,
}: {
  icon: string
  label: string
  sub: string
  tone: 'solar' | 'sky' | 'green' | 'ink'
}) {
  const tones: Record<string, string> = {
    solar: 'border-solar-200 bg-solar-50',
    sky: 'border-sky2-200 bg-sky2-50',
    green: 'border-emerald-200 bg-emerald-50',
    ink: 'border-ink-200 bg-ink-50',
  }
  return (
    <div
      className={`flex flex-1 flex-col items-center rounded-xl border px-3 py-4 text-center ${tones[tone]}`}
    >
      <div className="text-3xl leading-none">{icon}</div>
      <div className="mt-2 text-sm font-semibold text-ink-900">{label}</div>
      <div className="mt-0.5 text-xs text-ink-500">{sub}</div>
    </div>
  )
}

function Arrow({ tag }: { tag: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 text-ink-400">
      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
        {tag}
      </span>
      <span aria-hidden className="text-xl leading-none lg:rotate-0">
        →
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Guide() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* Hero ---------------------------------------------------------- */}
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="solar">☀️ Beginner-friendly</Badge>
          <Badge tone="sky">Global guide</Badge>
          <Badge tone="green">~15 min read</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          The complete guide to going solar
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-600 sm:text-lg">
          Everything a homeowner or business needs to understand before
          installing solar panels — how the technology works, whether your roof
          suits it, how to size and cost a system, the incentives that improve
          the maths, and how to keep it producing for decades. Written to be
          accurate worldwide, with notes for the UK, US, Australia, India and the
          EU.
        </p>
      </header>

      {/* Two-column layout -------------------------------------------- */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        {/* Sticky TOC ------------------------------------------------- */}
        <aside className="mb-8 lg:mb-0">
          <nav className="lg:sticky lg:top-20">
            <div className="card card-pad">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                On this page
              </p>
              <ul className="space-y-1">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main content ---------------------------------------------- */}
        <main className="space-y-12">
          {/* 1. HOW IT WORKS ---------------------------------------- */}
          <Section id="how-it-works">
            <Card>
              <SectionHeading
                icon="☀️"
                title="How solar PV works"
                subtitle="From sunlight to the sockets in your home"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  A solar panel turns light directly into electricity through the{' '}
                  <strong>photovoltaic effect</strong>. Each panel is made of many
                  silicon cells. When photons of sunlight strike a cell, they
                  knock electrons loose; the cell&apos;s built-in electric field
                  pushes those electrons in one direction, creating a flow of{' '}
                  <strong>direct current (DC)</strong>. No moving parts, no fuel,
                  no noise — just semiconductors doing their job whenever the sun
                  is up.
                </p>
                <p className="leading-relaxed">
                  Your home and the grid run on{' '}
                  <strong>alternating current (AC)</strong>, so the DC from the
                  panels must be converted. That is the inverter&apos;s job. From
                  there the electricity flows to your home first; any surplus is
                  exported to the grid, and any shortfall is imported from it.
                </p>

                {/* Flow diagram */}
                <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-400">
                    The energy flow
                  </p>
                  <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
                    <FlowNode
                      icon="🔆"
                      label="Solar panels"
                      sub="Generate DC"
                      tone="solar"
                    />
                    <Arrow tag="DC" />
                    <FlowNode
                      icon="🔌"
                      label="Inverter"
                      sub="DC → AC"
                      tone="sky"
                    />
                    <Arrow tag="AC" />
                    <FlowNode
                      icon="🏠"
                      label="Your home"
                      sub="Powers appliances"
                      tone="green"
                    />
                    <Arrow tag="surplus" />
                    <FlowNode
                      icon="⚡"
                      label="Grid / battery"
                      sub="Export or store"
                      tone="ink"
                    />
                  </div>
                </div>

                <Callout tone="solar" icon="📏" title="kWp vs kWh — the two numbers that matter">
                  <p>
                    <strong>kWp (kilowatt-peak)</strong> describes how{' '}
                    <em>big</em> a system is — its rated capacity under standard
                    test conditions. A typical home array is ~3–6 kWp.{' '}
                    <strong>kWh (kilowatt-hour)</strong> describes how much{' '}
                    <em>energy</em> it produces or you consume over time — what
                    your bill is measured in. As a rough rule, each 1 kWp produces
                    somewhere between <strong>~800 kWh/year</strong> (cloudy
                    northern climates) and <strong>~1,700 kWh/year</strong>{' '}
                    (sunny, well-oriented locations).
                  </p>
                </Callout>

                <p className="leading-relaxed">
                  A meter records what you import and export. How you are credited
                  for exports — net metering, a feed-in tariff, or an export tariff
                  — is set by local rules and has a big effect on the economics,
                  covered in the financing section below.
                </p>
              </div>
            </Card>
          </Section>

          {/* 2. SUITABILITY ----------------------------------------- */}
          <Section id="suitability">
            <Card>
              <SectionHeading
                icon="🏠"
                title="Is your property suitable?"
                subtitle="Most roofs work — these factors decide how well"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  The good news: far more roofs are viable than people assume. The
                  factors below determine not <em>whether</em> you can install, but
                  how much you will generate and how cost-effective it will be.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🧭 Orientation</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Equator-facing is best — <strong>due south</strong> in the
                      Northern Hemisphere, <strong>due north</strong> in the
                      Southern Hemisphere. East- or west-facing roofs still
                      perform well (typically ~80–90% of optimal) and spread output
                      across morning and evening, which can suit your usage better.
                      Avoid pole-facing roofs (north in the N hemisphere) as the
                      main array.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">📐 Pitch / tilt</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      A tilt roughly equal to your latitude is ideal, but anything
                      from about 10° to 50° is fine within a few percent. Flat
                      roofs are workable using tilted frames; very steep or very
                      shallow roofs lose a little but rarely enough to rule them
                      out.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🌳 Shading</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      The biggest avoidable killer of output. Chimneys, dormers,
                      satellite dishes, trees and neighbouring buildings can cast
                      shadows that disproportionately cut generation — especially
                      with string inverters. Note where shadows fall at{' '}
                      <strong>9am, noon and 3pm across the seasons</strong>.
                      Optimizers or microinverters help mitigate partial shade.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🧱 Roof condition & material</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Panels last 25–30+ years, so the roof beneath them should
                      have similar life left. If re-roofing is due within ~5 years,
                      do it first. Slate and clay tiles need careful (sometimes
                      pricier) mounting; standing-seam metal and composite shingle
                      are straightforward. Asbestos or fragile roofs need
                      specialist assessment.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🏗️ Structural load</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      A PV array adds roughly 12–25 kg/m². Most sound roofs handle
                      this easily, but older, large or flat roofs (where ballast
                      may be used) can warrant a structural check. A reputable
                      installer assesses rafters and spacing as part of the survey.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🌾 Available area & ground-mount</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      You need usable, unshaded space — budget roughly{' '}
                      <strong>6–10 m² per kWp</strong>. No suitable roof? A{' '}
                      <strong>ground-mount</strong> or field array lets you choose
                      the perfect tilt and orientation and simplifies maintenance,
                      though it costs more for frames and groundwork and may need
                      planning permission.
                    </p>
                  </div>
                </div>

                <Callout tone="green" icon="✅" title="Quick suitability checklist">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Roof faces broadly toward the equator, or east/west.</li>
                    <li>Minimal shading between roughly 9am and 3pm year-round.</li>
                    <li>Roof has 10+ years of life left and sound structure.</li>
                    <li>At least ~10–20 m² of clear, accessible area.</li>
                    <li>Tilt anywhere in the ~10–50° range (or flat with frames).</li>
                    <li>No heritage/conservation restriction (or you can get consent).</li>
                  </ul>
                  <p className="mt-2">
                    Tick most of these and solar is very likely worth a quote.
                  </p>
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 3. SIZING ---------------------------------------------- */}
          <Section id="sizing">
            <Card>
              <SectionHeading
                icon="📐"
                title="Sizing your system"
                subtitle="Match capacity to your consumption and your roof"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  Sizing is a balance between three things: how much electricity
                  you use, how much roof you have, and how you are paid for
                  exports. Work through it in order.
                </p>

                <ol className="space-y-5">
                  <Step n={1} title="Start from your annual consumption">
                    Find your yearly usage in kWh from past bills (a typical home
                    is ~2,700–5,000 kWh/yr; an all-electric home with a heat pump
                    or EV can be 6,000–12,000+). This is your anchor.
                  </Step>
                  <Step n={2} title="Estimate generation per kWp for your area">
                    Multiply 1 kWp by your local annual yield factor — about{' '}
                    <strong>800–1,000 kWh/kWp</strong> in cloudier northern
                    climates, <strong>1,100–1,400</strong> in temperate sun, and{' '}
                    <strong>1,500–1,700+</strong> in sunny regions. A planning tool
                    or PVGIS/NREL-style estimate refines this.
                  </Step>
                  <Step n={3} title="Divide to get a starting kWp">
                    Target kWp ≈ annual consumption ÷ yield factor. Example: 4,000
                    kWh/yr ÷ ~950 kWh/kWp ≈ <strong>~4.2 kWp</strong>. But you
                    rarely want to cover 100% on paper — see below.
                  </Step>
                  <Step n={4} title="Reality-check against roof area">
                    At ~6–10 m² per kWp, a 4 kWp array needs roughly 24–40 m². With
                    ~430–450 W panels that is about{' '}
                    <strong>9–10 panels per ~4 kWp</strong> (≈ 2–2.5 panels per
                    kWp). The smaller of &ldquo;what you need&rdquo; and
                    &ldquo;what fits&rdquo; usually wins.
                  </Step>
                  <Step n={5} title="Tune for your consumption profile">
                    If you are out all day and export most midday generation for a
                    low export rate, a smaller array (or a battery) gives better
                    returns. If you can shift loads to daytime — or have a battery,
                    EV or heat pump — a larger array pays.
                  </Step>
                </ol>

                <TableWrap>
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">System size</th>
                      <th className="px-4 py-2 font-semibold">Roof area (approx)</th>
                      <th className="px-4 py-2 font-semibold">Panels (~440 W)</th>
                      <th className="px-4 py-2 font-semibold">Typical annual yield</th>
                      <th className="px-4 py-2 font-semibold">Suits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 tnum">
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">3 kWp</td>
                      <td className="px-4 py-2">~18–24 m²</td>
                      <td className="px-4 py-2">~7</td>
                      <td className="px-4 py-2">~2,400–4,200 kWh</td>
                      <td className="px-4 py-2 text-ink-600">Small home, low use</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">5 kWp</td>
                      <td className="px-4 py-2">~30–40 m²</td>
                      <td className="px-4 py-2">~11–12</td>
                      <td className="px-4 py-2">~4,000–7,000 kWh</td>
                      <td className="px-4 py-2 text-ink-600">Average family home</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">8 kWp</td>
                      <td className="px-4 py-2">~48–64 m²</td>
                      <td className="px-4 py-2">~18</td>
                      <td className="px-4 py-2">~6,400–11,000 kWh</td>
                      <td className="px-4 py-2 text-ink-600">EV + heat pump home</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">20+ kWp</td>
                      <td className="px-4 py-2">~120+ m²</td>
                      <td className="px-4 py-2">~45+</td>
                      <td className="px-4 py-2">~16,000+ kWh</td>
                      <td className="px-4 py-2 text-ink-600">Commercial / large rural</td>
                    </tr>
                  </tbody>
                </TableWrap>

                <Callout tone="amber" icon="⚖️" title="Oversize vs export">
                  Slightly oversizing the array is usually wise: panels are the
                  cheapest part per watt, and you capture more on dull days and in
                  winter. The catch is what happens to the surplus — if your export
                  rate is poor, electricity you can&apos;t use yourself earns
                  little. The fix is to raise self-consumption (timers, a battery,
                  an EV, a hot-water diverter) rather than to shrink the array.
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 4. COSTS ----------------------------------------------- */}
          <Section id="costs">
            <Card>
              <SectionHeading
                icon="💷"
                title="Understanding costs"
                subtitle="What you pay for, and what drives the price"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  Solar is usually priced per watt installed (e.g. $/W or £/W) and
                  there are strong <strong>economies of scale</strong> — bigger
                  systems cost more in total but less per watt. The figures below
                  are broad ballparks; local labour, hardware and incentives move
                  them significantly.
                </p>

                <TableWrap>
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Segment</th>
                      <th className="px-4 py-2 font-semibold">Typical installed cost</th>
                      <th className="px-4 py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">Residential</td>
                      <td className="px-4 py-2 tnum">~$1.0–3.0 / W</td>
                      <td className="px-4 py-2 text-ink-600">
                        Highest per-watt; small jobs, scaffolding, lots of admin.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">Commercial</td>
                      <td className="px-4 py-2 tnum">~$0.8–1.8 / W</td>
                      <td className="px-4 py-2 text-ink-600">
                        Flat roofs and scale lower the per-watt cost.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">Utility</td>
                      <td className="px-4 py-2 tnum">~$0.6–1.1 / W</td>
                      <td className="px-4 py-2 text-ink-600">
                        Cheapest per watt; bulk hardware, simple ground mounts.
                      </td>
                    </tr>
                  </tbody>
                </TableWrap>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Callout tone="sky" icon="🔧" title="What drives $/W">
                    <ul className="list-inside list-disc space-y-1">
                      <li><strong>System size</strong> — bigger = cheaper per watt.</li>
                      <li><strong>Hardware tier</strong> — premium panels, microinverters and batteries cost more.</li>
                      <li><strong>Roof complexity</strong> — multiple facets, steep pitch, fragile tiles, height.</li>
                      <li><strong>Access & scaffolding</strong> — a real and often underestimated line item.</li>
                      <li><strong>Labour rates</strong> — vary hugely by country and region.</li>
                      <li><strong>Electrical upgrades</strong> — new consumer unit, meter, or cabling runs.</li>
                    </ul>
                  </Callout>
                  <Callout tone="green" icon="🧾" title="What a good quote includes">
                    <ul className="list-inside list-disc space-y-1">
                      <li>Panels, mounting, inverter (and battery if any).</li>
                      <li>All DC/AC cabling, isolators and protection.</li>
                      <li>Scaffolding, installation labour and roof flashing.</li>
                      <li>Monitoring hardware and app setup.</li>
                      <li>Grid/utility application and commissioning.</li>
                      <li>Certificates, warranties and an estimated yield.</li>
                    </ul>
                  </Callout>
                </div>

                <Callout tone="rose" icon="🕳️" title="Hidden costs to ask about">
                  Watch for extras that may not be in the headline price: a
                  consumer-unit/main-panel upgrade, bird/pest mesh, a long cable
                  run to the inverter, asbestos handling, structural works, tree
                  trimming, scaffolding for awkward access, and any
                  grid-connection or DNO/utility fees. Get them itemised before
                  you sign.
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 5. FINANCING ------------------------------------------- */}
          <Section id="financing">
            <Card>
              <SectionHeading
                icon="🏦"
                title="Financing & incentives"
                subtitle="How to pay, and the schemes that improve the maths"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  How you pay changes the returns as much as the hardware does.
                  There are three common routes, plus a layer of local incentives
                  on top.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-ink-100 p-4">
                    <Badge tone="green">Best ROI</Badge>
                    <p className="mt-2 font-semibold text-ink-900">Cash purchase</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      You own it outright and keep all the savings. Highest
                      upfront cost but the lowest lifetime cost and the strongest
                      return — your &ldquo;investment&rdquo; is the avoided
                      electricity bill.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <Badge tone="sky">Spread the cost</Badge>
                    <p className="mt-2 font-semibold text-ink-900">Loan / finance</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      You still own the system but borrow the capital. Works well
                      when the energy savings exceed the loan repayment. Compare
                      the interest rate against the system&apos;s effective return.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <Badge tone="amber">No upfront</Badge>
                    <p className="mt-2 font-semibold text-ink-900">Lease / PPA</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      A third party owns the panels; you pay a fixed lease or buy
                      the power (PPA) at a set per-kWh rate. Little or no upfront
                      cost, but lower savings and contract terms that can
                      complicate a future house sale.
                    </p>
                  </div>
                </div>

                <Callout tone="solar" icon="📊" title="Payback & ROI in plain terms">
                  <p>
                    <strong>Simple payback</strong> = total cost ÷ annual savings
                    (bill reduction + export income). A system costing £6,000 that
                    saves £750/year pays back in ~8 years, then keeps saving for
                    15+ more. Because panels last far longer than the payback
                    period, a typical home system delivers a healthy internal rate
                    of return — and electricity-price inflation tends to{' '}
                    <em>improve</em> it over time.
                  </p>
                </Callout>

                <h3 className="pt-1 font-semibold text-ink-900">
                  How you&apos;re paid for what you generate
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">Net metering</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Exports offset imports at (or near) the retail rate, so the
                      grid acts like a free battery. Generous where available
                      (parts of the US, India), though many regions are moving to
                      lower &ldquo;net-billing&rdquo; rates.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">Feed-in / export tariff</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      A set payment per exported kWh, usually below the import
                      price. This is why <strong>self-consumption</strong> matters:
                      a unit you use yourself is worth the full retail price you
                      avoid, not the lower export rate.
                    </p>
                  </div>
                </div>

                <h3 className="pt-1 font-semibold text-ink-900">
                  Incentives around the world
                </h3>
                <TableWrap>
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Region</th>
                      <th className="px-4 py-2 font-semibold">Headline support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">🇺🇸 United States</td>
                      <td className="px-4 py-2">
                        Federal Residential Clean Energy Credit (the
                        &ldquo;ITC&rdquo;), historically <strong>30%</strong> of
                        cost, often stacked with state/utility rebates and net
                        metering.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">🇬🇧 United Kingdom</td>
                      <td className="px-4 py-2">
                        <strong>0% VAT</strong> on residential solar &amp; storage,
                        plus the <strong>Smart Export Guarantee (SEG)</strong> for
                        export payments. Grants exist for some low-income
                        households.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">🇦🇺 Australia</td>
                      <td className="px-4 py-2">
                        <strong>Small-scale Technology Certificates (STCs)</strong>{' '}
                        cut the upfront cost, plus state feed-in tariffs and
                        battery incentives.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">🇮🇳 India</td>
                      <td className="px-4 py-2">
                        <strong>PM Surya Ghar: Muft Bijli Yojana</strong> offers
                        central subsidies for rooftop solar, alongside state net
                        metering.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">🇪🇺 European Union</td>
                      <td className="px-4 py-2">
                        Varies by member state — reduced VAT, grants, soft loans
                        and net-billing schemes are common under national energy
                        plans.
                      </td>
                    </tr>
                  </tbody>
                </TableWrap>

                <Callout tone="rose" icon="⚠️" title="Always check your local scheme">
                  Incentives change frequently and vary by region, household and
                  even installer accreditation. Treat the table above as a
                  starting point and confirm current rules with your government
                  energy body, utility and a certified installer before relying on
                  any figure.
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 6. BATTERIES ------------------------------------------- */}
          <Section id="batteries">
            <Card>
              <SectionHeading
                icon="🔋"
                title="Batteries & storage"
                subtitle="Store your surplus for the evening — when it makes sense"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  A home battery stores daytime surplus so you can use it after
                  dark instead of buying from the grid. It is a powerful upgrade —
                  but it is also the part of a system most likely to{' '}
                  <em>not</em> pay back on economics alone, so understand what you
                  are buying it for.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🌙 Self-consumption</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Use more of your own solar instead of exporting it cheaply
                      and re-buying at the higher import price in the evening.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">⏱️ Time-of-use arbitrage</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      On a tariff with cheap off-peak rates, charge the battery
                      when power is cheap (or solar is plentiful) and discharge
                      during expensive peak hours.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🔌 Backup power</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      With a backup-capable inverter, keep essentials running in an
                      outage. This is often the real reason people buy a battery.
                    </p>
                  </div>
                </div>

                <Callout tone="sky" icon="🔢" title="Usable vs nominal capacity, and round-trip efficiency">
                  A battery rated &ldquo;10 kWh&rdquo; (nominal) usually offers
                  somewhat less <strong>usable</strong> capacity because a reserve
                  is held back to protect cell life (depth-of-discharge limits).
                  And every kWh stored loses a little on the way in and out —{' '}
                  <strong>round-trip efficiency</strong> is typically ~85–95%. So
                  10 kWh in might return ~8.5–9 kWh of usable energy. Compare
                  quoted <em>usable</em> figures, not just headline capacity.
                </Callout>

                <h3 className="font-semibold text-ink-900">Sizing a battery</h3>
                <p className="leading-relaxed">
                  Aim to match your typical{' '}
                  <strong>daily surplus and evening load</strong>, not your whole
                  daily consumption. A common starting point for a UK/EU home is
                  ~5–10 kWh usable; bigger than your nightly need just adds cost
                  that rarely cycles. If you mainly want backup, size to the
                  essentials (fridge, lights, router, boiler controls) for the
                  hours you want covered.
                </p>

                <TableWrap>
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Chemistry</th>
                      <th className="px-4 py-2 font-semibold">Strengths</th>
                      <th className="px-4 py-2 font-semibold">Trade-offs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">
                        LFP (LiFePO₄)
                      </td>
                      <td className="px-4 py-2">
                        Long cycle life, very safe, tolerant of deep discharge —
                        now the default for home storage.
                      </td>
                      <td className="px-4 py-2 text-ink-600">
                        Slightly lower energy density (larger/heavier per kWh).
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">NMC</td>
                      <td className="px-4 py-2">
                        Higher energy density — more kWh in a smaller, lighter
                        package.
                      </td>
                      <td className="px-4 py-2 text-ink-600">
                        Shorter cycle life and higher thermal-management demands.
                      </td>
                    </tr>
                  </tbody>
                </TableWrap>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Callout tone="green" icon="👍" title="A battery tends to pay off when…">
                    <ul className="list-inside list-disc space-y-1">
                      <li>The import-to-export price gap is large.</li>
                      <li>You have a cheap off-peak tariff to arbitrage.</li>
                      <li>Your evening/night usage is high.</li>
                      <li>You value backup during outages.</li>
                    </ul>
                  </Callout>
                  <Callout tone="rose" icon="👎" title="…and rarely pays when">
                    <ul className="list-inside list-disc space-y-1">
                      <li>Export rates are close to import rates.</li>
                      <li>You already use most solar during the day.</li>
                      <li>The battery is far bigger than your nightly need.</li>
                      <li>Upfront cost is high relative to local savings.</li>
                    </ul>
                  </Callout>
                </div>

                <Callout tone="amber" icon="📅" title="Lifespan, cycles & warranty">
                  Modern LFP batteries are typically warranted for{' '}
                  <strong>~10 years</strong> or a set number of cycles (often
                  ~6,000–10,000) and/or a retained-capacity guarantee (e.g. ≥70%
                  at end of warranty). One cycle per day means a 10-year warranty
                  is roughly 3,650 cycles — comfortably inside a good LFP rating.
                  Check whether the warranty is throughput-based and what
                  conditions could void it.
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 7. MAXIMISING ------------------------------------------ */}
          <Section id="maximising">
            <Card>
              <SectionHeading
                icon="📈"
                title="Maximising generation"
                subtitle="Squeeze the most out of every panel"
              />
              <div className="space-y-4 text-ink-700">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🧭 Tilt & azimuth</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Aim tilt ≈ your latitude and azimuth toward the equator for
                      maximum annual yield. A few degrees off costs very little, so
                      don&apos;t agonise — but avoid pole-facing roofs for the main
                      array.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🧩 Optimizers & microinverters</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      On shaded or multi-facet roofs, panel-level electronics let
                      each panel perform independently, so one shaded module no
                      longer drags down a whole string. They also give per-panel
                      monitoring.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🔁 Bifacial panels</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Capture light on the rear too. The gain depends on{' '}
                      <em>albedo</em> (ground reflectivity) and mounting height —
                      modest on a dark roof, but meaningful over light gravel,
                      concrete or snow.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="font-semibold text-ink-900">🌞 Trackers (ground mount)</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Single-axis trackers follow the sun east-to-west and can lift
                      annual yield by ~15–25%. They add cost and moving parts, so
                      they suit larger ground-mount arrays rather than rooftops.
                    </p>
                  </div>
                </div>

                <Callout tone="sky" icon="🔧" title="The DC/AC ratio (a little overbuild is good)">
                  Pairing more panel capacity (DC) than the inverter&apos;s rating
                  (AC) — a ratio of roughly <strong>1.1–1.3</strong> — means the
                  inverter runs near its efficient peak more of the time and you
                  harvest more in weak light, dawn and dusk. You lose a sliver to
                  &ldquo;clipping&rdquo; on the few brightest moments, but the
                  annual energy gain almost always wins.
                </Callout>

                <h3 className="font-semibold text-ink-900">More ways to lift output</h3>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span>🧹</span>
                    <span>
                      <strong>Keep panels clean.</strong> Rain handles most
                      cleaning; manually wash only if you see soiling from dust,
                      pollen, bird droppings or pollution. Even a little shade from
                      a dirty corner can cost a disproportionate amount.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>🌳</span>
                    <span>
                      <strong>Clear shading.</strong> Trim overhanging branches and
                      reposition aerials/dishes. Shade is the single biggest
                      recoverable loss on most roofs.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>↔️</span>
                    <span>
                      <strong>East-west splits on flat roofs.</strong> Two rows
                      facing opposite ways fit more panels with less self-shading
                      and spread output across the day — often better total energy
                      than one south-facing row.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>🗓️</span>
                    <span>
                      <strong>Seasonal tilt (ground mount).</strong> If frames
                      allow, a steeper winter angle and shallower summer angle adds
                      a few percent over a fixed tilt.
                    </span>
                  </li>
                </ul>
              </div>
            </Card>
          </Section>

          {/* 8. INSTALLATION ---------------------------------------- */}
          <Section id="installation">
            <Card>
              <SectionHeading
                icon="🛠️"
                title="The installation process"
                subtitle="From first quote to a system humming on your roof"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  A typical residential install takes <strong>1–3 days</strong> on
                  site, but the full journey — quote, design, approvals and grid
                  connection — usually spans <strong>a few weeks to a few
                  months</strong>, mostly waiting on paperwork. Here is the usual
                  order of events:
                </p>

                <ol className="space-y-5">
                  <Step n={1} title="Site survey & quote">
                    An installer assesses roof orientation, pitch, shading,
                    structure, electrics and access, then proposes a system with an
                    estimated yield and itemised price. Get 2–3 quotes.
                  </Step>
                  <Step n={2} title="System design">
                    Panel layout, string/inverter selection, battery (if any),
                    cable routes and protection are finalised, along with a
                    performance estimate.
                  </Step>
                  <Step n={3} title="Permits & grid/utility approval">
                    Where required, planning/building permits and a connection
                    application go to the network operator (DNO in the UK,
                    utility/AHJ in the US). Larger systems may need pre-approval
                    before install.
                  </Step>
                  <Step n={4} title="Scaffolding & access">
                    Safe roof access is set up. For many homes this is the first
                    visible sign work is starting.
                  </Step>
                  <Step n={5} title="Mounting & panels">
                    Roof anchors are fixed to rafters and flashed, rails attached,
                    and panels mounted and clamped down.
                  </Step>
                  <Step n={6} title="Electrical & inverter">
                    DC strings are wired to the inverter, AC is connected to your
                    consumer unit/main panel with the necessary isolators and
                    protection, and the meter arrangement is sorted.
                  </Step>
                  <Step n={7} title="Battery (if included)">
                    Storage and its hybrid/backup inverter are installed and
                    configured, including any backup changeover for outage support.
                  </Step>
                  <Step n={8} title="Inspection & commissioning">
                    The system is tested, settings and safety checks completed, and
                    the inverter commissioned. You receive certificates and an
                    electrical safety report.
                  </Step>
                  <Step n={9} title="Grid connection & metering">
                    Final notification/approval and any meter change make export
                    official, so you can be credited for what you send back.
                  </Step>
                  <Step n={10} title="Handover & monitoring">
                    You get a walkthrough, documentation, warranties and access to
                    the monitoring app so you can watch generation from day one.
                  </Step>
                </ol>

                <Callout tone="green" icon="🗓️" title="Typical timeline">
                  Survey to signed quote: days to a couple of weeks. Approvals:
                  often the longest wait — a few weeks to a couple of months
                  depending on region. On-site install: 1–3 days for a home, longer
                  for commercial. Final grid sign-off: days to weeks after install.
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 9. MAINTENANCE ----------------------------------------- */}
          <Section id="maintenance">
            <Card>
              <SectionHeading
                icon="🧰"
                title="Maintenance"
                subtitle="One of the lowest-maintenance things you can put on a roof"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  Solar PV has no moving parts (rooftop systems), so maintenance is
                  light. A little attention keeps it producing at its best.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Callout tone="sky" icon="🧹" title="Cleaning">
                    Rain does most of the work. Clean only if you notice soiling —
                    dust, pollen, bird droppings, sap or pollution films. On
                    accessible low roofs a soft brush and water suffice; otherwise
                    use a professional. Never use abrasives or harsh chemicals.
                  </Callout>
                  <Callout tone="green" icon="📱" title="Monitoring">
                    Your best maintenance tool. Glance at the app periodically —
                    a sudden drop versus the weather or versus neighbouring panels
                    flags a fault early. Set up alerts if the system supports them.
                  </Callout>
                  <Callout tone="amber" icon="👀" title="Annual visual check">
                    Once a year, look for cracked glass, loose clamps, lifted
                    flashing, chafed cables, wasp nests and corrosion. A periodic
                    professional inspection (e.g. every few years) is wise,
                    especially for older systems.
                  </Callout>
                  <Callout tone="rose" icon="🔌" title="The inverter is the weak link">
                    Panels routinely outlast their inverter. A string inverter
                    often needs replacing at <strong>~10–15 years</strong>;
                    microinverters tend to last longer but multiply the count.
                    Budget for one inverter swap over the system&apos;s life.
                  </Callout>
                </div>

                <h3 className="font-semibold text-ink-900">Seasonal & environmental care</h3>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span>🌳</span>
                    <span>
                      <strong>Trim vegetation</strong> before fast-growing branches
                      start shading the array.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>❄️</span>
                    <span>
                      <strong>Snow</strong> usually slides off tilted panels as
                      they warm; avoid scraping with hard tools that can scratch
                      glass. Heavy persistent snow simply pauses generation.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>🐦</span>
                    <span>
                      <strong>Bird/pest mesh</strong> around the array edge stops
                      pigeons nesting underneath and fouling panels — a cheap,
                      worthwhile add-on in many areas.
                    </span>
                  </li>
                </ul>
              </div>
            </Card>
          </Section>

          {/* 10. LIFESPAN ------------------------------------------- */}
          <Section id="lifespan">
            <Card>
              <SectionHeading
                icon="♻️"
                title="Lifespan & degradation"
                subtitle="A 25–30+ year asset that fades slowly and recycles well"
              />
              <div className="space-y-4 text-ink-700">
                <p className="leading-relaxed">
                  Solar panels are a long-life investment. They don&apos;t fail
                  suddenly at a fixed age; instead their output declines very
                  gradually through <strong>degradation</strong>, typically{' '}
                  <strong>~0.4–0.6% per year</strong>. After 25 years a quality
                  panel often still produces ~85–90% of its original output.
                </p>

                <TableWrap>
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Component</th>
                      <th className="px-4 py-2 font-semibold">Typical lifespan</th>
                      <th className="px-4 py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">Panels</td>
                      <td className="px-4 py-2 tnum">25–30+ years</td>
                      <td className="px-4 py-2 text-ink-600">
                        Keep working beyond warranty, just at reduced output.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">String inverter</td>
                      <td className="px-4 py-2 tnum">~10–15 years</td>
                      <td className="px-4 py-2 text-ink-600">
                        Plan for at least one replacement over the system&apos;s life.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">Microinverters</td>
                      <td className="px-4 py-2 tnum">~15–25 years</td>
                      <td className="px-4 py-2 text-ink-600">
                        Often warranted ~25 years, but there are many units.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-ink-900">Battery</td>
                      <td className="px-4 py-2 tnum">~10–15 years</td>
                      <td className="px-4 py-2 text-ink-600">
                        Capacity fades with cycles; warranties guarantee a retained %.
                      </td>
                    </tr>
                  </tbody>
                </TableWrap>

                <Callout tone="solar" icon="📜" title="Two warranties — know the difference">
                  <p>
                    A <strong>product (workmanship) warranty</strong> covers
                    physical defects in the panel itself — commonly{' '}
                    <strong>~12–25 years</strong>. A separate{' '}
                    <strong>performance warranty</strong> guarantees a minimum
                    output over time — typically <strong>~25 years to ~85–90%</strong>{' '}
                    of the original rating. Premium panels increasingly offer 25–30
                    year product cover. Always read both, and the inverter and
                    battery warranties too.
                  </p>
                </Callout>

                <Callout tone="green" icon="♻️" title="End of life & the circular economy">
                  Panels are largely recyclable — glass, aluminium frames, copper
                  and silicon can be recovered, and recycling capacity is growing
                  (in the EU, producers are responsible for take-back under WEEE
                  rules). When a panel finally retires, it should be recycled
                  rather than landfilled, and decommissioned modules increasingly
                  find a second life. Solar&apos;s lifetime carbon &ldquo;payback&rdquo; —
                  the energy used to make it versus the clean energy it
                  generates — is usually just a couple of years.
                </Callout>
              </div>
            </Card>
          </Section>

          {/* 11. MISTAKES ------------------------------------------- */}
          <Section id="mistakes">
            <Card>
              <SectionHeading
                icon="⚠️"
                title="Common mistakes to avoid"
                subtitle="Learn from the errors that cost people money and yield"
              />
              <div className="space-y-3 text-ink-700">
                {[
                  {
                    t: 'Undersizing — or pointlessly oversizing',
                    d: 'Too small leaves savings on the table; too big for your usage (with a poor export rate) means cheap exported units you barely benefit from. Size to consumption, roof and export economics together.',
                  },
                  {
                    t: 'Ignoring shading',
                    d: 'A single shaded panel can hobble a whole string. Survey shadows across the day and seasons, and use optimizers/microinverters where shade is unavoidable.',
                  },
                  {
                    t: 'Chasing the cheapest quote',
                    d: 'The lowest bid often skimps on hardware quality, workmanship or warranty support. Compare like-for-like on components, accreditation and aftercare — not just headline price.',
                  },
                  {
                    t: 'Wrong inverter sizing',
                    d: 'An inverter far too small clips peak output; one too large runs inefficiently at low light. Aim for a sensible DC/AC ratio (~1.1–1.3) for your array and climate.',
                  },
                  {
                    t: 'Skipping installer accreditation',
                    d: 'Use certified installers (MCS in the UK, NABCEP-certified in the US, CEC-accredited in Australia, and equivalents elsewhere). Accreditation often gates incentives and protects warranties.',
                  },
                  {
                    t: 'Forgetting permits & insurance',
                    d: 'Missing permits, grid approval or notifying your home insurer can void incentives or cover. Confirm all paperwork before and after install.',
                  },
                  {
                    t: 'Never looking at the monitoring',
                    d: 'Faults can go unnoticed for months without monitoring. Check the app periodically and act on sustained drops.',
                  },
                  {
                    t: "Buying a battery that won't pay",
                    d: 'If your export and import rates are similar and you already self-consume most generation, a battery may not earn its keep. Buy it for backup or self-sufficiency with eyes open.',
                  },
                ].map((m) => (
                  <div
                    key={m.t}
                    className="flex gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4"
                  >
                    <span className="text-lg leading-none">⚠️</span>
                    <div>
                      <p className="font-semibold text-ink-900">{m.t}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-700">{m.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* 12. FAQ ------------------------------------------------ */}
          <Section id="faq">
            <Card>
              <SectionHeading
                icon="❓"
                title="Frequently asked questions"
                subtitle="Straight answers to the questions people ask most"
              />
              <div className="divide-y divide-ink-100">
                {FAQS.map((faq, i) => {
                  const open = openFaq === i
                  return (
                    <div key={faq.q} className="py-1">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-center justify-between gap-4 py-3 text-left"
                      >
                        <span className="font-semibold text-ink-900">{faq.q}</span>
                        <span
                          aria-hidden
                          className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ink-100 text-ink-600 transition-transform ${
                            open ? 'rotate-45' : ''
                          }`}
                        >
                          +
                        </span>
                      </button>
                      {open && (
                        <div className="pb-4 pr-10 text-sm leading-relaxed text-ink-700">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </Section>

          {/* 13. GLOSSARY ------------------------------------------ */}
          <Section id="glossary">
            <Card>
              <SectionHeading
                icon="📖"
                title="Glossary"
                subtitle="The vocabulary of solar, decoded"
              />
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {GLOSSARY.map((g) => (
                  <Term key={g.term} term={g.term}>
                    {g.def}
                  </Term>
                ))}
              </dl>
            </Card>
          </Section>

          {/* Closing note + disclaimer ----------------------------- */}
          <section className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-solar-500 to-solar-600 p-6 text-white shadow-lift sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight">
                You&apos;re ready to take the next step ☀️
              </h2>
              <p className="mt-2 max-w-3xl leading-relaxed text-solar-50">
                Going solar is one of the most durable, satisfying upgrades you can
                make to a property — lower bills, cleaner energy and decades of
                quiet generation. Armed with this guide, you can read a quote
                critically, ask sharp questions, and choose a system that fits your
                roof, your usage and your budget. The best time to start is a
                sunny afternoon and a couple of certified quotes.
              </p>
            </div>

            <Callout tone="ink" icon="ℹ️" title="A note on the figures in this guide">
              All costs, yields, payback periods and incentive details here are{' '}
              <strong>general planning estimates</strong> meant for orientation,
              not financial or engineering advice. Real numbers depend heavily on
              your location, roof, tariffs, hardware and the rules in force at the
              time. Always obtain detailed quotes from{' '}
              <strong>certified local installers</strong> and confirm current
              incentives with your government energy body and utility before
              committing.
            </Callout>
          </section>
        </main>
      </div>
    </div>
  )
}
