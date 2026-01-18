import { fetchPackageJson } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { addStyle, getNpmContext, isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label for packages that ship types. This is similar to npm's own DT / TS icon but
with a more consistent UI.
`

export const disabled = true

export function runPre() {
  addPackageLabelStyle()
  addStyle(`
    h1 > div[data-nosnippet="true"] {
      display: none !important;
    }
  `)
}

export async function run() {
  if (!isValidPackagePage()) return

  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const typesInfo = parseNpmTypes()
  if (typesInfo.type === 'none') {
    // Right now the detection isn't perfect as some packages may only specify `.js` in the
    // package.json and rely on the adjacent `.d.ts` files for types, which is hard to detect
    // without fetching the list of files directly (which can be a bit expensive). So we just
    // don't show that it has no types for now.
  } else if (typesInfo.type === 'bundled') {
    const label = addPackageLabel('show-types-label', 'DTS')
    label.title = 'This package ships TypeScript types'
  } else if (typesInfo.type === 'package') {
    const label = addPackageLabel('show-types-label', `DTS: ${typesInfo.packageName}`)
    label.title = `This package relies on ${typesInfo.packageName} for TypeScript types`
  } else {
    console.warn('[npm-userscript:show-types-label] unable to determine types info')
  }
}

function parseNpmTypes() {
  const npmTypes = getNpmContext().context.capsule.types
  // e.g. https://www.npmjs.com/package/ihimnm
  if (npmTypes.typescript == null) {
    return { type: 'none' }
  }
  // e.g. https://www.npmjs.com/package/vite
  if (npmTypes.typescript.bundled) {
    return { type: 'bundled' }
  }
  // e.g. https://www.npmjs.com/package/fs-extra
  if (npmTypes.typescript.package) {
    return { type: 'package', packageName: npmTypes.typescript.package }
  }
  return { type: 'unknown' }
}
