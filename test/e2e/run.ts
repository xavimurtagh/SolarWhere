/**
 * Browser end-to-end smoke test (Playwright + Chromium).
 *
 * Builds-then-serves the production app, visits every screen in a real
 * browser, fails on any console/page error, verifies key content (including
 * that Recharts SVGs and the Leaflet map actually mount), and writes a
 * screenshot of each screen to test/e2e/screenshots/.
 *
 * Run with:  npm run build && npm run e2e
 *
 * If a Chromium binary isn't available (e.g. it was blocked from download in a
 * restricted environment), the test SKIPS with a clear message and exit code 0
 * rather than failing — run `npx playwright install chromium` somewhere
 * unrestricted to enable it.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PORT = 4318
const BASE = `http://localhost:${PORT}`
const here = dirname(fileURLToPath(import.meta.url))
const shotDir = join(here, 'screenshots')

const SCREENS: { label: string; expect: string }[] = [
  { label: 'Home', expect: 'Know exactly what solar' },
  { label: 'Solar Calculator', expect: 'Your site' },
  { label: 'Battery Advisor', expect: 'Battery Storage Advisor' },
  { label: 'Optimizer', expect: 'Generation Optimizer' },
  { label: 'Enterprise & Gov', expect: 'Enterprise & Government Planner' },
  { label: 'Guide', expect: 'How' },
]

async function waitForServer(url: string, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('preview server did not start in time')
}

async function main() {
  // Lazy import so a missing package/browser is handled gracefully.
  let chromium: typeof import('playwright').chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.log('⚠️  Playwright not installed — skipping browser E2E. (npm i -D playwright)')
    process.exit(0)
  }

  const server: ChildProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    stdio: 'ignore',
    detached: false,
  })

  const cleanup = () => {
    try {
      server.kill('SIGTERM')
    } catch {
      /* ignore */
    }
  }

  try {
    await waitForServer(BASE)

    let browser
    try {
      browser = await chromium.launch()
    } catch (err) {
      console.log('⚠️  Chromium binary unavailable — skipping browser E2E.')
      console.log('    Enable with: npx playwright install chromium (in an unrestricted environment)')
      console.log(`    (${(err as Error).message.split('\n')[0]})`)
      cleanup()
      process.exit(0)
    }

    mkdirSync(shotDir, { recursive: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto(BASE, { waitUntil: 'networkidle' })

    let failures = 0
    for (const screen of SCREENS) {
      if (screen.label !== 'Home') {
        await page.getByRole('button', { name: screen.label }).first().click()
      }
      await page.waitForTimeout(700)
      const body = (await page.textContent('body')) ?? ''
      const ok = body.includes(screen.expect)
      console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${screen.label} — content present`)
      if (!ok) failures++

      // Charts should render an SVG on data screens.
      if (['Solar Calculator', 'Optimizer', 'Battery Advisor'].includes(screen.label)) {
        const svgs = await page.locator('svg.recharts-surface').count()
        const okSvg = svgs > 0
        console.log(`  [${okSvg ? 'PASS' : 'FAIL'}] ${screen.label} — ${svgs} chart(s) rendered`)
        if (!okSvg) failures++
      }
      await page.screenshot({ path: join(shotDir, `${screen.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`), fullPage: true })
    }

    // Exercise the interactive map (proves Leaflet mounts).
    await page.getByRole('button', { name: 'Solar Calculator' }).first().click()
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: 'Draw on map' }).first().click()
    await page.waitForTimeout(1500)
    const mapMounted = (await page.locator('.leaflet-container').count()) > 0
    console.log(`  [${mapMounted ? 'PASS' : 'FAIL'}] Calculator — Leaflet map mounts`)
    if (!mapMounted) failures++
    await page.screenshot({ path: join(shotDir, 'calculator-map.png'), fullPage: true })

    if (errors.length) {
      failures += errors.length
      console.log(`\n  ${errors.length} console/page error(s):`)
      errors.slice(0, 10).forEach((e) => console.log(`    • ${e}`))
    } else {
      console.log('  [PASS] no console or page errors')
    }

    await browser.close()
    cleanup()
    console.log(`\n=== ${failures === 0 ? 'E2E PASSED' : failures + ' E2E CHECK(S) FAILED'} ===`)
    console.log(`Screenshots → ${shotDir}`)
    process.exit(failures === 0 ? 0 : 1)
  } catch (err) {
    console.error('E2E error:', (err as Error).message)
    cleanup()
    process.exit(1)
  }
}

main()
