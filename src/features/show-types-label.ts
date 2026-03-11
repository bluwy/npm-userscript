import { fetchPackageFilesData, fetchPackageJson } from '../utils-fetch.ts'
import { getNpmContext } from '../utils-npm-context.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { addStyle, getPackageName, isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Adds a label for packages that publish TypeScript types. This is similar to npm's own DT / TS icon but
with a more consistent UI. It is also more accurate if the package publishes types but isn't detectable
in the package.json.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-types-label')?.remove()
}

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
  if (document.querySelector('.npm-userscript-types-label')) return

  const packageName = getPackageName()
  if (!packageName) return
  if (packageName.startsWith('create-') || /^@.+\/create-/.test(packageName)) {
    // We don't really care about types for template CLIs
  }

  const typesInfo = parseNpmTypes()

  if (typesInfo.type === 'none') {
    // Npm might not detect this correctly. We check from its published files instead.
    const data = await fetchPackageFilesData()
    if (
      Object.keys(data?.files ?? {}).some(
        (p) => p.endsWith('.d.ts') || p.endsWith('.d.mts') || p.endsWith('.d.cts'),
      )
    ) {
      typesInfo.type = 'bundled'
    }
    // Additionally, maybe this package intentionally does not have types because it's not
    // publishing any JS files
    else {
      // Check the main and exports field recursively for values that end with .js, .mjs, and .cjs
      const packageJson = await fetchPackageJson()
      function hasJsFiles(value: any): boolean {
        if (typeof value === 'string') {
          return value.endsWith('.js') || value.endsWith('.mjs') || value.endsWith('.cjs')
        } else if (Array.isArray(value)) {
          return value.some(hasJsFiles)
        } else if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(hasJsFiles)
        }
        return false
      }
      if (!hasJsFiles(packageJson?.main) && !hasJsFiles(packageJson?.exports)) {
        return
      }
    }
  }

  let label: HTMLElement | undefined
  if (typesInfo.type === 'none') {
    label = addPackageLabel('show-types-label', 'Untyped', 'warning')
    label.title = 'This package does not publish TypeScript types'
  } else if (typesInfo.type === 'bundled') {
    label = addPackageLabel('show-types-label', 'DTS')
    label.title = 'This package publishes TypeScript types'
  } else if (typesInfo.type === 'package') {
    label = addPackageLabel(
      'show-types-label',
      `DTS: <a href="https://www.npmjs.com/package/${typesInfo.packageName}">${typesInfo.packageName}</a>`,
    )
    label.title = `This package relies on ${typesInfo.packageName} for TypeScript types`
  } else {
    console.warn('[npm-userscript:show-types-label] unable to determine types info')
  }
  label?.classList.add('npm-userscript-types-label')
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
