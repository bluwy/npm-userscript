import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label of the engine versions (e.g. Node.js) that a package supports.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-engine-label')?.remove()
}

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return
  if (document.querySelector('.npm-userscript-engine-label')) return

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const engines = packageJson.engines
  if (!engines || Object.keys(engines).length === 0) return

  // Handle Node.js
  if (engines.node) {
    const label = addPackageLabel('show-engine-label', `Node.js ${engines.node}`)
    label.classList.add('npm-userscript-engine-label')
    label.title = `This package requires Node.js ${engines.node}`
  }

  // NOTE: Maybe support more engines in the future, but at the moment Node.js seems to be the only
  // widely used one. npm/pnpm versions isn't very useful I think, and there's not much usage for
  // deno/bun either.
}
