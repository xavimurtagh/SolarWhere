import { Suspense, lazy, useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import type { Section } from './lib/nav'
import Home from './features/home/Home'

// Heavy feature routes are code-split and loaded on demand.
const Calculator = lazy(() => import('./features/calculator/Calculator'))
const BatteryAdvisor = lazy(() => import('./features/battery/BatteryAdvisor'))
const Optimizer = lazy(() => import('./features/optimizer/Optimizer'))
const EnterprisePlanner = lazy(() => import('./features/enterprise/EnterprisePlanner'))
const Guide = lazy(() => import('./features/guide/Guide'))

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32 text-ink-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-solar-500" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState<Section>('home')

  // Scroll to top whenever the active section changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [section])

  return (
    <Layout current={section} onNavigate={setSection}>
      <Suspense fallback={<RouteFallback />}>
        {section === 'home' && <Home onNavigate={setSection} />}
        {section === 'calculator' && <Calculator />}
        {section === 'battery' && <BatteryAdvisor />}
        {section === 'optimizer' && <Optimizer />}
        {section === 'enterprise' && <EnterprisePlanner />}
        {section === 'guide' && <Guide />}
      </Suspense>
    </Layout>
  )
}
