export type Section =
  | 'home'
  | 'calculator'
  | 'battery'
  | 'optimizer'
  | 'enterprise'
  | 'guide'

export interface NavItem {
  id: Section
  label: string
  icon: string
  blurb: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: '☀️', blurb: 'Overview & how it works' },
  { id: 'calculator', label: 'Solar Calculator', icon: '🧮', blurb: 'Estimate generation, savings & payback' },
  { id: 'battery', label: 'Battery Advisor', icon: '🔋', blurb: 'Should you add storage?' },
  { id: 'optimizer', label: 'Optimizer', icon: '🎯', blurb: 'Maximise your generation' },
  { id: 'enterprise', label: 'Enterprise & Gov', icon: '🏛️', blurb: 'Portfolio & grid-scale planning' },
  { id: 'guide', label: 'Guide', icon: '📘', blurb: 'Install, maintain, optimise' },
]
