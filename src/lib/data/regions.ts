/**
 * Reference regions with climate, price, carbon and policy defaults.
 *
 * Figures are representative planning estimates (2024-era) expressed in
 * USD-equivalent so financials are comparable across regions. Latitude is
 * signed (negative in the southern hemisphere). `annualGHI` is global
 * horizontal irradiation in kWh/m²/year; `gridCarbonKgPerKWh` is the grid
 * emission factor; `costMultiplier` scales the global installed-cost curve
 * (baseline 1.0 ≈ United States).
 */

import type { RegionData } from '../solar/types'

export const REGIONS: RegionData[] = [
  // ── North America ────────────────────────────────────────────────
  {
    id: 'us-phoenix', name: 'Phoenix, AZ', country: 'United States', hemisphere: 'N',
    lat: 33.45, lon: -112.07, annualGHI: 2100, avgTempC: 24,
    gridCarbonKgPerKWh: 0.42, electricityPrice: 0.14, exportPrice: 0.08, currency: '$',
    costMultiplier: 1.0, incentiveFraction: 0.3, incentiveNote: 'Federal ITC 30% tax credit',
  },
  {
    id: 'us-losangeles', name: 'Los Angeles, CA', country: 'United States', hemisphere: 'N',
    lat: 34.05, lon: -118.24, annualGHI: 1900, avgTempC: 18,
    gridCarbonKgPerKWh: 0.22, electricityPrice: 0.30, exportPrice: 0.10, currency: '$',
    costMultiplier: 1.05, incentiveFraction: 0.3, incentiveNote: 'Federal ITC 30% + state incentives',
  },
  {
    id: 'us-newyork', name: 'New York, NY', country: 'United States', hemisphere: 'N',
    lat: 40.71, lon: -74.01, annualGHI: 1500, avgTempC: 13,
    gridCarbonKgPerKWh: 0.21, electricityPrice: 0.24, exportPrice: 0.10, currency: '$',
    costMultiplier: 1.05, incentiveFraction: 0.4, incentiveNote: 'Federal ITC 30% + NY-Sun + tax credit',
  },
  {
    id: 'us-seattle', name: 'Seattle, WA', country: 'United States', hemisphere: 'N',
    lat: 47.61, lon: -122.33, annualGHI: 1200, avgTempC: 11,
    gridCarbonKgPerKWh: 0.10, electricityPrice: 0.12, exportPrice: 0.05, currency: '$',
    costMultiplier: 1.0, incentiveFraction: 0.3, incentiveNote: 'Federal ITC 30% tax credit',
  },
  {
    id: 'ca-toronto', name: 'Toronto', country: 'Canada', hemisphere: 'N',
    lat: 43.65, lon: -79.38, annualGHI: 1300, avgTempC: 9,
    gridCarbonKgPerKWh: 0.05, electricityPrice: 0.11, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.9, incentiveFraction: 0.0, incentiveNote: 'Net metering; Canada Greener Homes loan',
  },
  {
    id: 'ca-vancouver', name: 'Vancouver', country: 'Canada', hemisphere: 'N',
    lat: 49.28, lon: -123.12, annualGHI: 1150, avgTempC: 11,
    gridCarbonKgPerKWh: 0.02, electricityPrice: 0.09, exportPrice: 0.05, currency: '$',
    costMultiplier: 0.9, incentiveFraction: 0.0, incentiveNote: 'Net metering; low-carbon hydro grid',
  },
  {
    id: 'mx-mexicocity', name: 'Mexico City', country: 'Mexico', hemisphere: 'N',
    lat: 19.43, lon: -99.13, annualGHI: 1900, avgTempC: 16,
    gridCarbonKgPerKWh: 0.42, electricityPrice: 0.10, exportPrice: 0.05, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Net metering (medición neta)',
  },

  // ── Europe ───────────────────────────────────────────────────────
  {
    id: 'uk-london', name: 'London', country: 'United Kingdom', hemisphere: 'N',
    lat: 51.51, lon: -0.13, annualGHI: 1000, avgTempC: 11,
    gridCarbonKgPerKWh: 0.21, electricityPrice: 0.34, exportPrice: 0.07, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.0, incentiveNote: '0% VAT on installs; SEG export payments',
  },
  {
    id: 'uk-edinburgh', name: 'Edinburgh', country: 'United Kingdom', hemisphere: 'N',
    lat: 55.95, lon: -3.19, annualGHI: 900, avgTempC: 9,
    gridCarbonKgPerKWh: 0.21, electricityPrice: 0.34, exportPrice: 0.07, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.0, incentiveNote: '0% VAT on installs; SEG export payments',
  },
  {
    id: 'de-berlin', name: 'Berlin', country: 'Germany', hemisphere: 'N',
    lat: 52.52, lon: 13.40, annualGHI: 1100, avgTempC: 10,
    gridCarbonKgPerKWh: 0.38, electricityPrice: 0.40, exportPrice: 0.08, currency: '$',
    costMultiplier: 0.65, incentiveFraction: 0.0, incentiveNote: '0% VAT; KfW loans; EEG feed-in tariff',
  },
  {
    id: 'fr-paris', name: 'Paris', country: 'France', hemisphere: 'N',
    lat: 48.86, lon: 2.35, annualGHI: 1200, avgTempC: 12,
    gridCarbonKgPerKWh: 0.06, electricityPrice: 0.25, exportPrice: 0.10, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.1, incentiveNote: "Prime à l'autoconsommation + feed-in",
  },
  {
    id: 'es-madrid', name: 'Madrid', country: 'Spain', hemisphere: 'N',
    lat: 40.42, lon: -3.70, annualGHI: 1750, avgTempC: 15,
    gridCarbonKgPerKWh: 0.17, electricityPrice: 0.25, exportPrice: 0.10, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.4, incentiveNote: 'Next-Gen EU subsidies + IBI tax rebate',
  },
  {
    id: 'it-rome', name: 'Rome', country: 'Italy', hemisphere: 'N',
    lat: 41.90, lon: 12.50, annualGHI: 1600, avgTempC: 16,
    gridCarbonKgPerKWh: 0.26, electricityPrice: 0.30, exportPrice: 0.10, currency: '$',
    costMultiplier: 0.65, incentiveFraction: 0.5, incentiveNote: 'Detrazione 50% tax deduction',
  },
  {
    id: 'nl-amsterdam', name: 'Amsterdam', country: 'Netherlands', hemisphere: 'N',
    lat: 52.37, lon: 4.90, annualGHI: 1050, avgTempC: 10,
    gridCarbonKgPerKWh: 0.33, electricityPrice: 0.35, exportPrice: 0.10, currency: '$',
    costMultiplier: 0.65, incentiveFraction: 0.0, incentiveNote: 'Net metering (salderingsregeling)',
  },
  {
    id: 'se-stockholm', name: 'Stockholm', country: 'Sweden', hemisphere: 'N',
    lat: 59.33, lon: 18.07, annualGHI: 980, avgTempC: 7,
    gridCarbonKgPerKWh: 0.03, electricityPrice: 0.20, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.2, incentiveNote: 'Green tech deduction (grön teknik)',
  },

  // ── Middle East & Africa ────────────────────────────────────────
  {
    id: 'ae-dubai', name: 'Dubai', country: 'UAE', hemisphere: 'N',
    lat: 25.20, lon: 55.27, annualGHI: 2100, avgTempC: 28,
    gridCarbonKgPerKWh: 0.45, electricityPrice: 0.10, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Shams Dubai net metering',
  },
  {
    id: 'sa-riyadh', name: 'Riyadh', country: 'Saudi Arabia', hemisphere: 'N',
    lat: 24.71, lon: 46.68, annualGHI: 2200, avgTempC: 26,
    gridCarbonKgPerKWh: 0.60, electricityPrice: 0.05, exportPrice: 0.03, currency: '$',
    costMultiplier: 0.55, incentiveFraction: 0.0, incentiveNote: 'Vision 2030 renewable program',
  },
  {
    id: 'eg-cairo', name: 'Cairo', country: 'Egypt', hemisphere: 'N',
    lat: 30.04, lon: 31.24, annualGHI: 2100, avgTempC: 22,
    gridCarbonKgPerKWh: 0.45, electricityPrice: 0.05, exportPrice: 0.03, currency: '$',
    costMultiplier: 0.5, incentiveFraction: 0.0, incentiveNote: 'Net metering for rooftop solar',
  },
  {
    id: 'za-capetown', name: 'Cape Town', country: 'South Africa', hemisphere: 'S',
    lat: -33.92, lon: 18.42, annualGHI: 2000, avgTempC: 17,
    gridCarbonKgPerKWh: 0.90, electricityPrice: 0.15, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Tax rebate for rooftop PV; net billing',
  },
  {
    id: 'za-johannesburg', name: 'Johannesburg', country: 'South Africa', hemisphere: 'S',
    lat: -26.20, lon: 28.04, annualGHI: 2050, avgTempC: 16,
    gridCarbonKgPerKWh: 0.90, electricityPrice: 0.15, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Tax rebate for rooftop PV; net billing',
  },
  {
    id: 'ng-lagos', name: 'Lagos', country: 'Nigeria', hemisphere: 'N',
    lat: 6.52, lon: 3.38, annualGHI: 1800, avgTempC: 27,
    gridCarbonKgPerKWh: 0.40, electricityPrice: 0.10, exportPrice: 0.04, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.0, incentiveNote: 'Strong self-consumption vs diesel backup',
  },
  {
    id: 'ke-nairobi', name: 'Nairobi', country: 'Kenya', hemisphere: 'S',
    lat: -1.29, lon: 36.82, annualGHI: 2000, avgTempC: 19,
    gridCarbonKgPerKWh: 0.10, electricityPrice: 0.18, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.0, incentiveNote: 'Net metering; VAT exemption on solar',
  },

  // ── Asia ─────────────────────────────────────────────────────────
  {
    id: 'in-delhi', name: 'New Delhi', country: 'India', hemisphere: 'N',
    lat: 28.61, lon: 77.21, annualGHI: 1900, avgTempC: 25,
    gridCarbonKgPerKWh: 0.71, electricityPrice: 0.09, exportPrice: 0.04, currency: '$',
    costMultiplier: 0.4, incentiveFraction: 0.4, incentiveNote: 'PM Surya Ghar rooftop subsidy',
  },
  {
    id: 'in-mumbai', name: 'Mumbai', country: 'India', hemisphere: 'N',
    lat: 19.08, lon: 72.88, annualGHI: 1900, avgTempC: 27,
    gridCarbonKgPerKWh: 0.71, electricityPrice: 0.10, exportPrice: 0.04, currency: '$',
    costMultiplier: 0.4, incentiveFraction: 0.4, incentiveNote: 'PM Surya Ghar rooftop subsidy',
  },
  {
    id: 'cn-beijing', name: 'Beijing', country: 'China', hemisphere: 'N',
    lat: 39.90, lon: 116.41, annualGHI: 1500, avgTempC: 13,
    gridCarbonKgPerKWh: 0.58, electricityPrice: 0.08, exportPrice: 0.05, currency: '$',
    costMultiplier: 0.4, incentiveFraction: 0.0, incentiveNote: 'Distributed PV subsidies vary by province',
  },
  {
    id: 'cn-shanghai', name: 'Shanghai', country: 'China', hemisphere: 'N',
    lat: 31.23, lon: 121.47, annualGHI: 1300, avgTempC: 17,
    gridCarbonKgPerKWh: 0.58, electricityPrice: 0.08, exportPrice: 0.05, currency: '$',
    costMultiplier: 0.4, incentiveFraction: 0.0, incentiveNote: 'Distributed PV subsidies vary by province',
  },
  {
    id: 'jp-tokyo', name: 'Tokyo', country: 'Japan', hemisphere: 'N',
    lat: 35.68, lon: 139.69, annualGHI: 1300, avgTempC: 16,
    gridCarbonKgPerKWh: 0.47, electricityPrice: 0.22, exportPrice: 0.08, currency: '$',
    costMultiplier: 0.85, incentiveFraction: 0.1, incentiveNote: 'FIT/FIP; municipal subsidies',
  },
  {
    id: 'sg-singapore', name: 'Singapore', country: 'Singapore', hemisphere: 'N',
    lat: 1.35, lon: 103.82, annualGHI: 1600, avgTempC: 28,
    gridCarbonKgPerKWh: 0.40, electricityPrice: 0.23, exportPrice: 0.10, currency: '$',
    costMultiplier: 0.7, incentiveFraction: 0.0, incentiveNote: 'SolarNova; enhanced central intermediary scheme',
  },

  // ── Oceania ──────────────────────────────────────────────────────
  {
    id: 'au-sydney', name: 'Sydney', country: 'Australia', hemisphere: 'S',
    lat: -33.87, lon: 151.21, annualGHI: 1750, avgTempC: 18,
    gridCarbonKgPerKWh: 0.68, electricityPrice: 0.25, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.45, incentiveFraction: 0.3, incentiveNote: 'Small-scale Technology Certificates (STCs)',
  },
  {
    id: 'au-melbourne', name: 'Melbourne', country: 'Australia', hemisphere: 'S',
    lat: -37.81, lon: 144.96, annualGHI: 1450, avgTempC: 15,
    gridCarbonKgPerKWh: 0.79, electricityPrice: 0.22, exportPrice: 0.05, currency: '$',
    costMultiplier: 0.45, incentiveFraction: 0.3, incentiveNote: 'STCs + Solar Victoria rebate',
  },
  {
    id: 'au-brisbane', name: 'Brisbane', country: 'Australia', hemisphere: 'S',
    lat: -27.47, lon: 153.03, annualGHI: 1800, avgTempC: 21,
    gridCarbonKgPerKWh: 0.73, electricityPrice: 0.23, exportPrice: 0.06, currency: '$',
    costMultiplier: 0.45, incentiveFraction: 0.3, incentiveNote: 'Small-scale Technology Certificates (STCs)',
  },

  // ── South America ────────────────────────────────────────────────
  {
    id: 'br-saopaulo', name: 'São Paulo', country: 'Brazil', hemisphere: 'S',
    lat: -23.55, lon: -46.63, annualGHI: 1650, avgTempC: 19,
    gridCarbonKgPerKWh: 0.10, electricityPrice: 0.15, exportPrice: 0.08, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Net metering (geração distribuída)',
  },
  {
    id: 'br-rio', name: 'Rio de Janeiro', country: 'Brazil', hemisphere: 'S',
    lat: -22.91, lon: -43.17, annualGHI: 1800, avgTempC: 24,
    gridCarbonKgPerKWh: 0.10, electricityPrice: 0.16, exportPrice: 0.08, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Net metering (geração distribuída)',
  },
  {
    id: 'cl-santiago', name: 'Santiago', country: 'Chile', hemisphere: 'S',
    lat: -33.45, lon: -70.67, annualGHI: 1900, avgTempC: 14,
    gridCarbonKgPerKWh: 0.35, electricityPrice: 0.16, exportPrice: 0.07, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Ley de Generación Distribuida (net billing)',
  },
  {
    id: 'ar-buenosaires', name: 'Buenos Aires', country: 'Argentina', hemisphere: 'S',
    lat: -34.60, lon: -58.38, annualGHI: 1700, avgTempC: 18,
    gridCarbonKgPerKWh: 0.30, electricityPrice: 0.06, exportPrice: 0.04, currency: '$',
    costMultiplier: 0.6, incentiveFraction: 0.0, incentiveNote: 'Ley 27.424 distributed generation',
  },
]

export const DEFAULT_REGION =
  REGIONS.find((r) => r.id === 'uk-london') ?? REGIONS[0]

export function findRegion(id: string): RegionData {
  return REGIONS.find((r) => r.id === id) ?? DEFAULT_REGION
}

/** Regions grouped by country for nicer selectors. */
export function regionsByCountry(): Record<string, RegionData[]> {
  return REGIONS.reduce<Record<string, RegionData[]>>((acc, r) => {
    ;(acc[r.country] ??= []).push(r)
    return acc
  }, {})
}
