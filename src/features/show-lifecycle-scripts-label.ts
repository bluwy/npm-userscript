import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label if the package defines lifecycle scripts in its package.json.
`

const LIFECYCLE_SCRIPTS = ['postinstall', 'preinstall', 'install', 'prepublish', 'prepare']

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-lifecycle-scripts-label')?.remove()
}

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return
  if (document.querySelector('.npm-userscript-lifecycle-scripts-label')) return

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const scriptNames = Object.keys(packageJson.scripts || {})

  const matchedScripts = LIFECYCLE_SCRIPTS.filter((script) => scriptNames.includes(script))
  if (matchedScripts.length === 0) return

  const label = addPackageLabel('show-lifecycle-scripts-label', `Runs script on install`, 'warning')
  label.classList.add('npm-userscript-lifecycle-scripts-label')
  label.title = `This package defines lifecycle scripts that run on install: ${matchedScripts.map((s) => `"${s}"`).join(', ')}`
}
