import {
  fetchPackageFileContent,
  fetchPackageFilesData,
  fetchPackageJson,
  type PackageFilesData,
} from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle } from '../utils-ui.ts'
import { isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Show ESM or CJS labels if the package ships them.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelectorAll('.npm-userscript-file-types-label').forEach((el) => el.remove())
}

export function runPre() {
  addPackageLabelStyle()
}

export async function run() {
  if (!isValidPackagePage()) return
  if (document.querySelector('.npm-userscript-file-types-label')) return

  const data = await fetchPackageFilesData()
  if (!data) return
  const packageJson = await fetchPackageJson()
  if (!packageJson) return

  const fileNames = Object.keys(data.files).sort()
  const fileTypes = await detectFileTypes(fileNames, data.files, packageJson)

  if (fileTypes.hasEsm) {
    const label = addPackageLabel('show-file-types-label', 'ESM')
    label.classList.add('npm-userscript-file-types-label')
    label.title = 'This package ships ECMAScript Modules (ESM)'
  }

  if (fileTypes.hasCjs) {
    const label = addPackageLabel('show-file-types-label', 'CJS')
    label.classList.add('npm-userscript-file-types-label')
    label.title = 'This package ships CommonJS modules (CJS)'
  }
}

async function detectFileTypes(
  fileNames: string[],
  files: PackageFilesData['files'],
  rootPackageJson: Record<string, any>,
) {
  let hasEsm = false
  let hasCjs = false

  // First do a quick check with explicit file extensions
  for (const fileName of fileNames) {
    if (fileName.endsWith('.mjs')) {
      hasEsm = true
    } else if (fileName.endsWith('.cjs')) {
      hasCjs = true
    }
    if (hasEsm && hasCjs) break
  }

  if (hasEsm && hasCjs) {
    return { hasEsm, hasCjs }
  }

  // If one of them is false, do a more thorough check with .js files
  for (const fileName of fileNames) {
    if (fileName.endsWith('.js')) {
      const packageJson = await getNearesetPackageJson(fileName)
      if (packageJson?.type === 'module') {
        hasEsm = true
      } else {
        hasCjs = true
      }
      if (hasEsm && hasCjs) break
    }
  }

  return { hasEsm, hasCjs }

  async function getNearesetPackageJson(path: string): Promise<Record<string, any> | undefined> {
    const parts = path.split('/')
    while (parts.length > 0) {
      parts.pop()
      const candidatePath = parts.join('/') + '/package.json'

      if (candidatePath === '/package.json') {
        return rootPackageJson
      } else if (files[candidatePath]) {
        const content = await fetchPackageFileContent(files[candidatePath].hex)
        if (content) return JSON.parse(content)
      }
    }
  }
}
