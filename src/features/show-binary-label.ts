import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel } from '../utils-ui.ts'
import { isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label for packages that ship prebuilt native binaries.
`

const popularOs = ['linux', 'darwin', 'win32']
const popularArch = ['x64', 'arm64', 'ia32']

export async function run() {
  if (!isValidPackagePage()) return

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  if (!hasNativeBinaries(packageJson)) return

  const label = addPackageLabel('native', 'info')
  label.title = 'This package ships prebuilt native binaries via optional dependencies'
}

function hasNativeBinaries(packageJson: Record<string, any>): boolean {
  const optionalDependencies = Object.keys(packageJson.optionalDependencies || {})
  if (optionalDependencies.length <= 0) return false

  // Check "os" and "cpu" fields, if there's at least two matching popular ones, consider it is an
  // npm package shipping native binaries
  let matchCount = 0
  for (const dep of optionalDependencies) {
    if (
      popularOs.some((os) => dep.includes(os)) &&
      popularArch.some((arch) => dep.includes(arch)) &&
      ++matchCount >= 2
    ) {
      return true
    }
  }

  return false
}
