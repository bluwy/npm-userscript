import { fetchText } from '../utils-fetch.ts'
import {
  getPackageName,
  getPackageVersion,
  isSamePackagePage,
  isValidPackagePage,
  prettyBytes,
} from '../utils.ts'

export const description = `\
Display the tarball size of the package.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-tarball-size-column')?.remove()
}

export async function run() {
  if (!isValidPackagePage()) return
  if (document.querySelector('.npm-userscript-tarball-size-column')) return

  const tarballSize = await getTarballSize()
  if (!tarballSize) return

  // Inject after the "Unpacked size" column
  const columnToInsertAfter = await getColumnToInsertAfter()
  if (!columnToInsertAfter) return

  const tarballSizeColumn = columnToInsertAfter.cloneNode(true) as HTMLElement
  tarballSizeColumn.classList.add('npm-userscript-tarball-size-column')
  tarballSizeColumn.querySelector('h3')!.textContent = 'Tarball Size'
  tarballSizeColumn.querySelector('p')!.textContent = tarballSize
  columnToInsertAfter.insertAdjacentElement('afterend', tarballSizeColumn)
}

async function getTarballSize(): Promise<string | undefined> {
  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return
  const size = await fetchText(`${API_URL}/packed-size/${packageName}@${packageVersion}`)
  return prettyBytes(parseInt(size, 10))
}

async function getColumnToInsertAfter() {
  const column = getColumnByName('Unpacked Size')
  if (column) return column

  const featureSettings = await getFeatureSettings()

  // Possibly the column will be added in a while, so wait with a 5sec timeout
  if (featureSettings['unpacked-size-and-total-files'].get() === true) {
    let checks = 10 // 10 checks with 500ms interval = 5 seconds
    setInterval(() => {
      const column = getColumnByName('Unpacked Size')
      if (column || --checks <= 0) {
        return column
      }
    }, 500)
  }
  // Otherwise just add to the license column
  else {
    const column = getColumnByName('License')
    return column
  }
}

function getColumnByName(name: string) {
  const sidebarColumns = document.querySelectorAll('[aria-label="Package sidebar"] > div:has(> h3)')
  return Array.from(sidebarColumns).find((col) => col.querySelector('h3')?.textContent === name) as
    | HTMLElement
    | undefined
}

async function getFeatureSettings() {
  const settings = await import('../settings.ts')
  return settings.featureSettings
}
