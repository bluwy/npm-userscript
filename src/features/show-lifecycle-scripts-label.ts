import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label if the package defines lifecycle scripts in its package.json.
`

const LIFECYCLE_SCRIPTS = ['postinstall', 'preinstall', 'install', 'prepublish', 'prepare']

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const scriptNames = Object.keys(packageJson.scripts || {})

  const matchedScripts = LIFECYCLE_SCRIPTS.filter((script) => scriptNames.includes(script))
  if (matchedScripts.length === 0) return

  const label = addPackageLabel('show-lifecycle-scripts-label', `Runs script on install`, 'warning')
  label.title = `This package defines lifecycle scripts that run on install: ${matchedScripts.map((s) => `"${s}"`).join(', ')}`
}
