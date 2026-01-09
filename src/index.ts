import { allFeatures } from './all-features.ts'
import { featureSettings, injectSettingsTrigger } from './settings.ts'
import { cache } from './utils-cache.ts'
import { consolidateStyles, ensureSidebarBalance, waitForPageReady } from './utils.ts'

runFeatures()

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

  cache.clearExpired()
  ensureSidebarBalance()
  injectSettingsTrigger()
}
