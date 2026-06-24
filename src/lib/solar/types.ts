/**
 * SolarWhere — core domain types for the solar assessment engine.
 *
 * Conventions used throughout the engine:
 *  - Azimuth is given in COMPASS degrees: 0 = North, 90 = East, 180 = South,
 *    270 = West. Internally the physics functions convert to the Duffie &
 *    Beckman "surface azimuth" (0 = equator-facing, east negative, west
 *    positive) where needed.
 *  - Tilt is degrees from horizontal (0 = flat, 90 = vertical wall).
 *  - Energy is in kWh, power in kW unless suffixed otherwise.
 *  - Irradiance/insolation is in kWh/m²/day or kWh/m²/year as noted.
 */

export type Hemisphere = 'N' | 'S'

export interface LatLon {
  lat: number
  lon: number
}

/** The physical surface solar panels will be mounted on. */
export type SurfaceType =
  | 'roof-pitched'
  | 'roof-flat'
  | 'ground-field'
  | 'carport'
  | 'facade'

export interface Orientation {
  /** Degrees from horizontal: 0 = flat, 90 = vertical. */
  tiltDeg: number
  /** Compass azimuth the panels face: 0 = N, 90 = E, 180 = S, 270 = W. */
  azimuthDeg: number
}

/** A photovoltaic module product / archetype. */
export interface PanelSpec {
  id: string
  name: string
  /** Rated power at STC, watts-peak. */
  wattage: number
  /** Module conversion efficiency, fraction (0–1). */
  efficiency: number
  /** Physical module area, m². */
  areaM2: number
  /** Power temperature coefficient, %/°C (negative). */
  tempCoeffPctPerC: number
  /** Annual power degradation, fraction/year (e.g. 0.005 = 0.5%/yr). */
  degradationPerYear: number
  /** Nominal operating cell temperature, °C. */
  noctC: number
  /** Indicative hardware cost contribution, $/Wp (module only). */
  tier: 'budget' | 'standard' | 'premium'
}

/** How much electricity the site uses and when. */
export interface ConsumptionProfile {
  /** Annual electricity consumption, kWh/year. */
  annualKWh: number
  /**
   * Fraction of consumption that naturally occurs during daylight hours
   * (0–1). Drives self-consumption without a battery. Typical home ~0.3,
   * a business open 9–5 ~0.6, a 24/7 facility ~0.45.
   */
  daytimeFraction: number
}

/** Electricity tariff & price-escalation assumptions. */
export interface Tariff {
  currency: string
  /** Retail import price, $/kWh (what you pay the grid). */
  importPrice: number
  /** Export / feed-in price, $/kWh (what the grid pays you). */
  exportPrice: number
  /** Annual real electricity price inflation, fraction (e.g. 0.03). */
  priceInflationPerYear: number
  /** Fixed standing/connection charge, $/year (unaffected by solar). */
  standingChargePerYear?: number
}

/** Financial / appraisal assumptions. */
export interface FinanceParams {
  /** Real discount rate for NPV, fraction (e.g. 0.05). */
  discountRatePerYear: number
  /** Analysis horizon, years. */
  analysisYears: number
  /** Up-front incentive/grant as a fraction of capex (0–1). */
  upfrontSubsidyFraction: number
  /** Up-front incentive/grant as a fixed amount, $. */
  upfrontSubsidyFixed: number
  /** Annual O&M as a fraction of capex (e.g. 0.01). */
  omFractionPerYear: number
}

/** A reference region with climate, price and policy defaults. */
export interface RegionData {
  id: string
  name: string
  country: string
  hemisphere: Hemisphere
  /** Representative latitude, degrees. */
  lat: number
  /** Representative longitude, degrees. */
  lon: number
  /** Annual global horizontal irradiation, kWh/m²/year. */
  annualGHI: number
  /** Mean annual ambient air temperature, °C. */
  avgTempC: number
  /** Grid carbon intensity, kg CO₂e per kWh. */
  gridCarbonKgPerKWh: number
  /** Default retail electricity price, $/kWh. */
  electricityPrice: number
  /** Default export/feed-in price, $/kWh. */
  exportPrice: number
  /** Currency code/symbol used for display. */
  currency: string
  /** Installed cost multiplier relative to the global baseline (1.0). */
  costMultiplier: number
  /** Typical residential incentive as fraction of capex (0–1). */
  incentiveFraction: number
  /** Short note on the prevailing incentive scheme. */
  incentiveNote: string
}

/** Full input bundle for a site assessment. */
export interface AssessmentInput {
  location: LatLon
  hemisphere: Hemisphere
  surfaceType: SurfaceType
  /** Gross available area, m². Either this or `systemSizeKWp` drives sizing. */
  areaM2?: number
  /** Explicit desired system size, kWp (overrides area-based sizing). */
  systemSizeKWp?: number
  orientation: Orientation
  /** Shading loss, fraction (0 = none, 0.2 = 20% lost to shade). */
  shadingFraction: number
  /** Ground reflectance (albedo), fraction. Grass ~0.2, snow ~0.6. */
  albedo: number
  panel: PanelSpec
  consumption: ConsumptionProfile
  /** Battery usable capacity, kWh (0 = no battery). */
  batteryKWh: number
  tariff: Tariff
  finance: FinanceParams
  /** Annual GHI for the location, kWh/m²/yr. */
  annualGHI: number
  /** Mean annual ambient temperature, °C. */
  avgTempC: number
  /** Grid carbon intensity, kg CO₂e/kWh. */
  gridCarbonKgPerKWh: number
  /** Regional installed-cost multiplier relative to the global baseline. */
  costMultiplier?: number
  /** Cost overrides; if omitted the cost model is used. */
  costOverridePerWatt?: number
  batteryCostPerKWh?: number
}

/** Detailed breakdown of the performance ratio. */
export interface PerformanceRatio {
  inverter: number
  temperature: number
  soiling: number
  wiringMismatch: number
  availability: number
  lid: number
  /** Product of all factors. */
  total: number
}

export interface SizingResult {
  systemSizeKWp: number
  panelCount: number
  /** Area actually occupied by modules, m². */
  moduleAreaM2: number
  /** Fraction of gross area usable for modules. */
  usableFraction: number
  /** Gross area assumed/required, m². */
  grossAreaM2: number
  /** Module power density used, Wp/m² of module. */
  moduleWpPerM2: number
}

export interface GenerationResult {
  /** Plane-of-array annual irradiation, kWh/m²/yr. */
  annualPOA: number
  /** Transposition factor: POA / GHI. */
  transpositionFactor: number
  /** Per-month POA, kWh/m²/month (length 12, Jan–Dec). */
  monthlyPOA: number[]
  performanceRatio: PerformanceRatio
  /** Year-1 specific yield, kWh per kWp installed. */
  specificYield: number
  /** Year-1 total generation, kWh. */
  annualGenerationKWh: number
  /** Per-month generation, kWh (length 12). */
  monthlyGenerationKWh: number[]
  /** Generation in each analysis year (after degradation), kWh. */
  yearlyGenerationKWh: number[]
  /** Total lifetime generation across the analysis horizon, kWh. */
  lifetimeGenerationKWh: number
}

export interface EnergyFlowResult {
  /** Self-consumed fraction of generation (0–1). */
  selfConsumptionFraction: number
  /** Self-sufficiency: fraction of load met by solar+battery (0–1). */
  selfSufficiencyFraction: number
  /** Year-1 self-consumed energy, kWh. */
  selfConsumedKWh: number
  /** Year-1 exported energy, kWh. */
  exportedKWh: number
  /** Year-1 grid import still required, kWh. */
  gridImportKWh: number
  /** Extra self-consumption delivered by the battery, kWh/yr. */
  batteryContributionKWh: number
}

export interface FinanceResult {
  currency: string
  grossCapex: number
  netCapex: number
  subsidyApplied: number
  /** Year-1 bill savings (self-consumption value + export revenue), $. */
  year1Savings: number
  /** Simple payback period, years (Infinity if never). */
  paybackYears: number
  /** Net present value over the horizon, $. */
  npv: number
  /** Internal rate of return, fraction (NaN if undefined). */
  irr: number
  /** Levelised cost of energy, $/kWh. */
  lcoe: number
  /** Lifetime net savings (undiscounted), $. */
  lifetimeSavings: number
  /** Return on investment over the horizon, fraction. */
  roi: number
  /** Per-year cashflow detail. */
  cashflow: CashflowYear[]
}

export interface CashflowYear {
  year: number
  generationKWh: number
  savings: number
  costs: number
  net: number
  cumulative: number
  discountedNet: number
}

export interface EnvironmentResult {
  /** Year-1 CO₂ avoided, kg. */
  annualCO2Kg: number
  /** Lifetime CO₂ avoided, kg. */
  lifetimeCO2Kg: number
  /** Equivalent trees grown for 10 years. */
  treesEquivalent: number
  /** Equivalent passenger cars off the road for a year. */
  carsEquivalent: number
  /** Equivalent one-way economy flights London–New York. */
  flightsEquivalent: number
  /** Energy payback time, years (embodied energy / annual generation). */
  energyPaybackYears: number
}

/** The full assessment result returned by the engine. */
export interface AssessmentResult {
  input: AssessmentInput
  sizing: SizingResult
  generation: GenerationResult
  energyFlow: EnergyFlowResult
  finance: FinanceResult
  environment: EnvironmentResult
  /** Optimal orientation for this location (for guidance). */
  optimalOrientation: Orientation
  /** Fraction of optimal achieved by the chosen orientation (0–1+). */
  orientationEfficiency: number
}
