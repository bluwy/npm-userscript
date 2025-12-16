import { allFeatures } from './all-features.ts'
import { cache } from './utils-cache.ts'
import { consolidateStyles, waitForPageReady } from './utils.ts'

runFeatures()

async function runFeatures() {
  // Run pre
  for (const feature in allFeatures) {
    const mod = allFeatures[feature]
    allFeatures[feature].runPre?.()?.catch((err) => {
      console.error(`Error running pre for feature "${feature}":`, err)
    })
  }
  consolidateStyles()

  // Let npm's JS run a bit before we run our main features
  await waitForPageReady()

  // Run normal
  for (const feature in allFeatures) {
    const mod = allFeatures[feature]
    allFeatures[feature].run?.()?.catch((err) => {
      console.error(`Error running feature "${feature}":`, err)
    })
  }
  consolidateStyles()

  cache.clearExpired()
}
