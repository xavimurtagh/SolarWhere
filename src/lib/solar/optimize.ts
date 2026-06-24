/**
 * Optimization & grid-scale helpers for the enterprise / government planner.
 *
 *  - `optimizePortfolio` allocates a capital budget across candidate sites to
 *    maximise generation, CO₂ avoided or financial return (greedy by
 *    value-per-dollar, with a fractional top-up of the marginal site).
 *  - Grid-scale helpers translate land ↔ capacity ↔ generation and size the
 *    build-out needed to hit a GW target.
 */

export type PortfolioObjective = 'generation' | 'co2' | 'roi'

export interface PortfolioSite {
  id: string
  name: string
  capex: number
  annualGenerationKWh: number
  annualCO2Kg: number
  annualSavings: number
  capacityKWp: number
}

export interface PortfolioSelection {
  site: PortfolioSite
  /** Fraction of the site built (0–1). */
  fraction: number
  capexUsed: number
  generationKWh: number
  co2Kg: number
  savings: number
  capacityKWp: number
}

export interface PortfolioResult {
  selections: PortfolioSelection[]
  totalCapex: number
  totalGenerationKWh: number
  totalCO2Kg: number
  totalSavings: number
  totalCapacityKWp: number
  budget: number
  budgetUsedFraction: number
}

function objectiveMetric(site: PortfolioSite, objective: PortfolioObjective): number {
  switch (objective) {
    case 'generation':
      return site.annualGenerationKWh
    case 'co2':
      return site.annualCO2Kg
    case 'roi':
      return site.annualSavings
  }
}

/**
 * Greedy budget allocation: rank sites by objective-value per dollar, build
 * the best fully while budget allows, then partially build the next.
 */
export function optimizePortfolio(
  sites: PortfolioSite[],
  budget: number,
  objective: PortfolioObjective,
): PortfolioResult {
  const ranked = [...sites]
    .filter((s) => s.capex > 0)
    .sort(
      (a, b) =>
        objectiveMetric(b, objective) / b.capex -
        objectiveMetric(a, objective) / a.capex,
    )

  const selections: PortfolioSelection[] = []
  let remaining = budget

  for (const site of ranked) {
    if (remaining <= 0) break
    const fraction = Math.min(1, remaining / site.capex)
    if (fraction <= 0) continue
    selections.push({
      site,
      fraction,
      capexUsed: site.capex * fraction,
      generationKWh: site.annualGenerationKWh * fraction,
      co2Kg: site.annualCO2Kg * fraction,
      savings: site.annualSavings * fraction,
      capacityKWp: site.capacityKWp * fraction,
    })
    remaining -= site.capex * fraction
  }

  const totalCapex = selections.reduce((s, x) => s + x.capexUsed, 0)
  return {
    selections,
    totalCapex,
    totalGenerationKWh: selections.reduce((s, x) => s + x.generationKWh, 0),
    totalCO2Kg: selections.reduce((s, x) => s + x.co2Kg, 0),
    totalSavings: selections.reduce((s, x) => s + x.savings, 0),
    totalCapacityKWp: selections.reduce((s, x) => s + x.capacityKWp, 0),
    budget,
    budgetUsedFraction: budget > 0 ? totalCapex / budget : 0,
  }
}

/** Average household annual consumption used for "homes powered", kWh/yr. */
export const AVG_HOME_KWH = 3500

export function homesPowered(annualGenerationKWh: number, perHomeKWh = AVG_HOME_KWH): number {
  return annualGenerationKWh / perHomeKWh
}

/** Land coverage (kWp per hectare) for utility-scale fixed-tilt ground mount. */
export const KWP_PER_HECTARE = 700 // ≈ 0.7 MWp/ha ≈ 1.4 ha/MWp

export function hectaresToCapacity(hectares: number): number {
  return hectares * KWP_PER_HECTARE
}

export function capacityToHectares(capacityKWp: number): number {
  return capacityKWp / KWP_PER_HECTARE
}

export interface GridTargetPlan {
  targetMW: number
  capacityKWp: number
  annualGenerationGWh: number
  landHectares: number
  landKm2: number
  capex: number
  homesPowered: number
  annualCO2Tonnes: number
}

/**
 * Size the build-out needed to reach a target nameplate capacity (MW),
 * given a representative specific yield and cost.
 */
export function gridTargetPlan(
  targetMW: number,
  specificYieldKWhPerKWp: number,
  costPerWatt: number,
  gridCarbonKgPerKWh: number,
): GridTargetPlan {
  const capacityKWp = targetMW * 1000
  const annualGenerationKWh = capacityKWp * specificYieldKWhPerKWp
  const landHectares = capacityToHectares(capacityKWp)
  return {
    targetMW,
    capacityKWp,
    annualGenerationGWh: annualGenerationKWh / 1e6,
    landHectares,
    landKm2: landHectares / 100,
    capex: capacityKWp * 1000 * costPerWatt,
    homesPowered: homesPowered(annualGenerationKWh),
    annualCO2Tonnes: (annualGenerationKWh * gridCarbonKgPerKWh) / 1000,
  }
}

/** Assumed economic/accounting lifetime for lifetime-cost metrics, years. */
export const PROJECT_LIFETIME_YEARS = 25

/**
 * Inverse of the grid plan: the nameplate capacity (kWp) required to abate a
 * target amount of CO₂ each year, given a specific yield and grid carbon
 * factor. Scales linearly with the target and inversely with the carbon
 * factor. Returns 0 for a zero/negative carbon grid (no abatement possible,
 * so no finite capacity would help).
 */
export function capacityForCO2Target(
  targetTonnesPerYear: number,
  specificYieldKWhPerKWp: number,
  gridCarbonKgPerKWh: number,
): number {
  if (
    targetTonnesPerYear <= 0 ||
    specificYieldKWhPerKWp <= 0 ||
    gridCarbonKgPerKWh <= 0
  ) {
    return 0
  }
  const annualGenerationKWh = (targetTonnesPerYear * 1000) / gridCarbonKgPerKWh
  return annualGenerationKWh / specificYieldKWhPerKWp
}

/**
 * Approximate lifetime levelised cost of energy, $/kWh: total capex spread over
 * lifetime generation (ignores O&M, degradation and discounting — indicative
 * only). Returns Infinity when there is no generation.
 */
export function lcoeLifetime(
  capex: number,
  annualGenerationKWh: number,
  lifetimeYears: number = PROJECT_LIFETIME_YEARS,
): number {
  const lifetimeGeneration = annualGenerationKWh * lifetimeYears
  if (lifetimeGeneration <= 0) return Infinity
  return capex / lifetimeGeneration
}

/**
 * Carbon abatement cost, $/tonne CO₂: capex spread over lifetime CO₂ avoided.
 * Returns Infinity when no carbon is abated.
 */
export function abatementCost(
  capex: number,
  annualCO2Kg: number,
  lifetimeYears: number = PROJECT_LIFETIME_YEARS,
): number {
  const lifetimeTonnes = (annualCO2Kg / 1000) * lifetimeYears
  if (lifetimeTonnes <= 0) return Infinity
  return capex / lifetimeTonnes
}

/** Simple (undiscounted) payback in years. Infinity when there are no savings. */
export function simplePayback(capex: number, annualSavings: number): number {
  if (annualSavings <= 0) return Infinity
  return capex / annualSavings
}

/** A site as represented in the importable/exportable CSV. */
export interface SiteCSVRow {
  name: string
  regionId: string
  capacityKWp: number
}

/** Escape a single CSV field, quoting when it contains a comma, quote or newline. */
function escapeCSVField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Split one CSV line into fields, honouring double-quoted fields. */
function splitCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

/** Serialize sites to CSV text with a header row (name, regionId, capacityKWp). */
export function serializeSitesCSV(sites: SiteCSVRow[]): string {
  const lines = ['name,regionId,capacityKWp']
  for (const s of sites) {
    lines.push(
      [escapeCSVField(s.name), escapeCSVField(s.regionId), String(s.capacityKWp)].join(','),
    )
  }
  return lines.join('\n')
}

/**
 * Parse CSV text into site rows. Tolerates an optional header row, blank lines
 * and quoted fields. Capacity is coerced to a number and clamped to ≥ 1; rows
 * without a name or region id are skipped. Region ids are NOT validated here
 * (the caller maps unknown ids onto a fallback) so the helper stays pure.
 */
export function parseSitesCSV(text: string): SiteCSVRow[] {
  const rows: SiteCSVRow[] = []
  const lines = text.split(/\r\n|\r|\n/)
  for (const raw of lines) {
    if (raw.trim() === '') continue
    const fields = splitCSVLine(raw).map((f) => f.trim())
    const [name = '', regionId = '', capacityRaw = ''] = fields
    // Skip a header row.
    if (
      name.toLowerCase() === 'name' &&
      regionId.toLowerCase() === 'regionid'
    ) {
      continue
    }
    if (name === '' && regionId === '') continue
    const capacity = parseFloat(capacityRaw)
    rows.push({
      name: name || 'Imported site',
      regionId,
      capacityKWp: Math.max(1, Number.isFinite(capacity) ? capacity : 1),
    })
  }
  return rows
}
