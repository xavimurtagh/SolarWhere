# ☀️ SolarWhere

**Plan, estimate and optimise solar PV — for a roof, a field, a business or a whole grid.**

SolarWhere turns a location and a few inputs into a complete, physically-grounded
picture of going solar: how big a system to install, how much it will generate,
what you'll save, whether a battery pays off, how to squeeze out every extra
kilowatt-hour, and — for organisations — how to deploy capital and land for
maximum impact at city and grid scale.

It is a single-page web app with **no backend and no API keys** — every estimate
is computed in the browser from an open, inspectable solar-engineering model.

---

## ✨ What's inside

SolarWhere is six tools sharing one calculation engine:

| Tool | What it does |
|------|--------------|
| 🧮 **Solar Calculator** | The core estimator. Pick a location, draw your roof/field on a map (or enter the area), set orientation, shading and usage — get system size, monthly & lifetime generation, bill savings, payback, NPV/IRR/LCOE, self-consumption, and carbon avoided, all with charts. |
| 🔋 **Battery Advisor** | Runs the engine across battery sizes and tells you the financial sweet spot, self-sufficiency gains, payback per size, and *when storage is worth it vs. when it's really about backup/independence*. |
| 🎯 **Optimizer** | Maximise generation. Interactive tilt/azimuth sensitivity curves, a tilt × direction heatmap (% of the best possible yield), and concrete tips (trackers, bifacial, micro-inverters, DC/AC ratio, east-west splits…). |
| 🏛️ **Enterprise & Government Planner** | Two modes: a **multi-site portfolio optimiser** that allocates a capital budget across candidate sites to maximise energy, CO₂ or return; and a **grid-scale target planner** that sizes a build-out to a GW goal or a parcel of land (capacity, GWh, hectares/km², capex, homes powered, CO₂). |
| 📘 **Guide** | A thorough, written guide: how PV works, suitability, sizing, costs, financing & incentives, batteries, maximising output, the install process, maintenance, lifespan & recycling, common mistakes, FAQ and a glossary. |
| 🏠 **Home** | Overview and on-ramp to the tools. |

**Across the whole app:**

- 💷 **Input by bill _or_ kWh** — don't know your usage? Enter your average monthly bill and SolarWhere infers it from your tariff.
- 🏦 **Cash vs. loan financing** — see the up-front-vs-monthly trade-off, total interest, and whether solar is cashflow-positive from day one.
- 🧾 **Before/after bill** — your monthly electricity bill, before and after going solar.
- 💾 **Save, 🔗 share & ⚖️ compare** — autosaves locally, encodes the whole scenario into a shareable URL, and compares saved scenarios (5 kW vs 8 kW, battery vs not…) side by side.
- ⬇️ **Export** — download a CSV (summary + 25-year cashflow) or 🖨️ print a clean report for your installer.
- ♿ **Accessible & responsive** — keyboard focus styles, ARIA labels, reduced-motion support, a mobile sticky summary, and graceful empty/edge states.
- 📊 **Enterprise extras** — sortable cost-efficiency table ($/kWh, $/tonne CO₂, payback), CSV import/export of sites, portfolio-level ROI, and a carbon-target inverse planner.

---

## 🔬 The model (how the numbers are produced)

The engine lives in [`src/lib/solar/`](src/lib/solar) and is pure, typed and
unit-tested. It is built from standard solar-engineering methods rather than
black-box fudge factors:

- **Irradiance profile** (`irradiance.ts`) — distributes a location's annual
  GHI across months using extraterrestrial radiation, reproducing the
  latitude-driven seasonal swing while preserving the annual total.
- **Geometry & transposition** (`geometry.ts`) — converts global horizontal
  irradiance to plane-of-array irradiance for any tilt/azimuth using solar
  declination, the **Erbs** diffuse-fraction correlation, a numerically
  integrated **Liu–Jordan** isotropic sky model and the **Duffie–Beckman**
  angle-of-incidence formula. Also finds the optimal orientation for a site.
- **Sizing** (`system.ts`) — translates a surface (pitched/flat roof, field,
  carport, façade) and area into a real array (panel count, kWp, occupied area)
  using realistic packing/ground-coverage factors.
- **Generation** (`generation.ts`) — a temperature-aware **performance ratio**
  (NOCT model + component losses), specific yield, and year-on-year output with
  panel degradation over the analysis horizon.
- **Energy flow & battery** (`battery.ts`) — an energy-conserving daily-bucket
  model splitting generation into self-consumed / exported / grid-import, with a
  battery time-shifting surplus (round-trip losses included).
- **Costs** (`costs.ts`) — turn-key $/W and $/kWh that fall with system size
  (economies of scale), scaled by region; inverter replacement.
- **Finance** (`finance.ts`) — full cashflow with price escalation, simple
  payback, **NPV**, **IRR** (bisection) and **LCOE**.
- **Financing** (`financing.ts`) — cash-vs-loan amortization, total interest,
  monthly net cashflow and loan breakeven.
- **Environment** (`environment.ts`) — CO₂ avoided, relatable equivalents
  (trees, cars, flights) and energy payback time.
- **Optimization** (`optimize.ts`) — greedy budget allocation across sites and
  grid-scale land ↔ capacity ↔ generation helpers.

Regional defaults (sunlight, electricity & export prices, grid carbon intensity,
install-cost multipliers and incentives for **35+ locations** across six
continents) live in [`src/lib/data/`](src/lib/data) and are all editable in the
UI's *Advanced assumptions*.

> **Validation.** The engine is sanity-checked against PVWatts-style benchmarks
> (e.g. specific yields of ~1,940 kWh/kWp in Phoenix and ~1,010 in London,
> performance ratios of 0.82–0.86, correct hemisphere optima). See
> `npm run test:engine`.

---

## 🛠️ Tech stack

- **Vite** + **React 18** + **TypeScript** (strict)
- **Tailwind CSS** for styling
- **Recharts** for charts, **Leaflet** / **react-leaflet** for the map
  area-picker (OpenStreetMap tiles — no key required)
- Fully client-side; deployable as a static site. Heavy routes are
  code-split and lazy-loaded.

---

## 🚀 Getting started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
```

### Tests

```bash
npm run test          # unit suite + engine sanity + render smoke (86+ tests)
npm run test:unit     # per-module unit tests (edge cases & invariants)
npm run test:engine   # physical-plausibility checks against benchmarks
npm run test:render   # server-render every screen to catch runtime errors
npm run typecheck     # tsc -b --noEmit
npm run build && npm run e2e   # real-browser E2E (Playwright): console-error
                               # checks + screenshots of every screen
```

The unit suite covers every engine module with edge cases (zero area, polar
latitudes, never-pays-back, divide-by-zero guards) and **invariants** — energy
conservation, bounded self-sufficiency, monotonic battery behaviour, and a
full-pipeline property test across all regions × surfaces × battery options.
The E2E test drives a real browser to confirm charts and the Leaflet map render
without console errors; it **skips gracefully** if no Chromium binary is
available (e.g. restricted CI), so run `npx playwright install chromium` to
enable it.

---

## 🗂️ Project structure

```
src/
  lib/
    solar/            # the calculation engine (pure, typed, tested)
      geometry.ts     #   solar position, transposition, optimal orientation
      irradiance.ts   #   monthly irradiance profile from annual GHI
      system.ts       #   area ⇄ capacity sizing
      generation.ts   #   performance ratio, yield, degradation
      battery.ts      #   self-consumption + storage model
      costs.ts        #   cost curves
      finance.ts      #   payback, NPV, IRR, LCOE
      financing.ts    #   cash vs loan amortization
      environment.ts  #   CO₂ + equivalents
      optimize.ts     #   portfolio + grid-scale helpers
      types.ts        #   shared domain types
    data/             # regions + panel datasets
    assess.ts         # builds inputs from regional defaults and runs the engine
    scenario.ts       # calculator state: persistence, share URLs, comparison
    format.ts, geo.ts, nav.ts
  components/         # Layout, UI primitives, charts, map picker
  features/           # home, calculator, battery, optimizer, enterprise, guide
test/
  unit/               # per-module unit tests (node:test)
  e2e/                # Playwright browser test + screenshots
  *.smoke.ts(x)       # engine sanity + server-render smoke tests
```

## ➕ Extending

- **Add a region**: append a `RegionData` entry in
  [`src/lib/data/regions.ts`](src/lib/data/regions.ts).
- **Add a panel**: append a `PanelSpec` in
  [`src/lib/data/panels.ts`](src/lib/data/panels.ts).
- **Tune the model**: every assumption (loss factors, cost curves,
  equivalency factors) is a named constant in the relevant engine module.

---

## ⚠️ Disclaimer

SolarWhere produces **independent planning estimates** from representative data
and physical models. Real-world results vary with local weather, tariffs,
hardware, roof specifics and installation quality. Monetary figures are shown in
USD-equivalent for cross-region comparison. **Always obtain certified local
quotes and a professional site survey before investing.**
