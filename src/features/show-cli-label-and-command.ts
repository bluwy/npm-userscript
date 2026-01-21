import { fetchPackageJson } from '../utils-fetch.ts'
import { getNpmContext } from '../utils-npm-context.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import {
  getPackageName,
  getPackageVersion,
  isSamePackagePage,
  isValidPackagePage,
} from '../utils.ts'

export const description = `\
Adds a label if the package ships a CLI via the package.json "bin" field, and update the install
command to "npm create" or "npx" accordingly.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-types-label')?.remove()
}

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return
  if (document.querySelector('.npm-userscript-types-label')) return

  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return

  const isLatest = getNpmContext().context.packument.distTags.latest === packageVersion

  if (packageName.startsWith('create-') || /^@.+\/create-/.test(packageName)) {
    const label = addPackageLabel('show-cli-label-and-command', 'CLI')
    label.classList.add('npm-userscript-types-label')
    label.title = 'This package is a template CLI'
    const atVersion = isLatest ? '@latest' : `@${packageVersion}`
    updateCodeBlock(`npm create ${packageName.slice('create-'.length)}${atVersion}`)
    return
  }

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const binNames = getBinNames(packageJson.bin, packageName)
  if (binNames.length === 0) return

  const label = addPackageLabel('show-cli-label-and-command', 'CLI')
  label.classList.add('npm-userscript-types-label')
  label.title = `This package ships the ${binNames.map((n) => `"${n}"`).join(', ')} command`

  if (!packageJson.main && !packageJson.exports && !packageJson.browser && !packageJson.module) {
    const atVersion = isLatest ? '' : `@${packageVersion}`
    updateCodeBlock(`npx ${packageName}${atVersion}`)
  }
}

function getBinNames(binField: any, packageName: string): string[] {
  if (typeof binField === 'string') {
    return [packageName.startsWith('@') ? packageName.split('/')[1] : packageName]
  } else if (typeof binField === 'object' && binField !== null) {
    return Object.keys(binField)
  } else {
    return []
  }
}

function updateCodeBlock(command: string) {
  const codeBlock = document.querySelector('[aria-label="Package sidebar"] code')
  if (!codeBlock) return

  codeBlock.textContent = command
  // NOTE: The copy button automatically picks up this change, so no handling needed for it
}
