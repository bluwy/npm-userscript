import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { getPackageName, isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label if the package ships a CLI via the package.json "bin" field.
`

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return

  const packageName = getPackageName()
  if (!packageName) return
  if (packageName.startsWith('create-') || /^@.+\/create-/.test(packageName)) {
    const label = addPackageLabel('show-cli-label', 'CLI')
    label.title = 'This package is a template CLI'
    return
  }

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const binNames = getBinNames(packageJson.bin, packageName)
  if (binNames.length === 0) return

  const label = addPackageLabel('show-cli-label', 'CLI')
  label.title = `This package ships the ${binNames.map((n) => `"${n}"`).join(', ')} command`
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
