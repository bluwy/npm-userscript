import { allFeatures } from './all-features.ts'
import { clearOutdatedSettings, featureSettings, injectSettingsTrigger } from './settings.ts'
import { cache } from './utils-cache.ts'
import { listenNavigate, waitForPageReady } from './utils-navigation.ts'
import { listenNpmContext, waitForNpmContextReady } from './utils-npm-context.ts'
import { consolidateStyles, ensureSidebarBalance, teardownSidebarBalance } from './utils.ts'

// esbuild define
declare global {
  const API_URL: string
}

listenNpmContext()
runFeatures().then(() => runNotImportantStuff())
listenNavigate(async (previousUrl) => {
  const promises: Promise<void>[] = []

  // Run teardown
  for (const feature in allFeatures) {
    if (featureSettings[feature].get() === false) continue
    const promise = allFeatures[feature].teardown?.(previousUrl)?.catch((err) => {
      console.error(`Error running teardown for feature "${feature}":`, err)
    })
    if (promise) promises.push(promise)
  }
  await Promise.all(promises)

  teardownSidebarBalance()

  await runFeatures()
})

async function runFeatures() {
  const promises: Promise<void>[] = []

  // Run pre
  for (const feature in allFeatures) {
    if (featureSettings[feature].get() === false) continue
    const promise = allFeatures[feature].runPre?.()?.catch((err) => {
      console.error(`Error running pre for feature "${feature}":`, err)
    })
    if (promise) promises.push(promise)
  }
  await Promise.all(promises)
  promises.length = 0
  consolidateStyles()

  // Let npm's JS run a bit before we run our main features
  await waitForPageReady()
  await waitForNpmContextReady()

  // Run normal
  for (const feature in allFeatures) {
    if (featureSettings[feature].get() === false) continue
    const promise = allFeatures[feature].run?.()?.catch((err) => {
      console.error(`Error running feature "${feature}":`, err)
    })
    if (promise) promises.push(promise)
  }
  await Promise.all(promises)
  promises.length = 0
  consolidateStyles()

  // "Features" that always run
  ensureSidebarBalance()
  injectSettingsTrigger()
}

function runNotImportantStuff() {
  cache.clearExpired()
  clearOutdatedSettings()
}
