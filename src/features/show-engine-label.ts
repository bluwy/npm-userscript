import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label of the engine versions (e.g. Node.js) that a package supports.
`

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const engines = packageJson.engines
  if (!engines || Object.keys(engines).length === 0) return

  // Handle Node.js
  if (engines.node) {
    const label = addPackageLabel('show-engine-label', `Node.js ${engines.node}`)
    label.title = `This package requires Node.js ${engines.node}`
  }

  // NOTE: Maybe support more engines in the future, but at the moment Node.js seems to be the only
  // widely used one. npm/pnpm versions isn't very useful I think, and there's not much usage for
  // deno/bun either.
}
