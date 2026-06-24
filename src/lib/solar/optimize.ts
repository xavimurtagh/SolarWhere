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
