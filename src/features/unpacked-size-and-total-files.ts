import { fetchPackageFilesData } from '../utils-fetch.ts'
import { isSamePackagePage, isValidPackagePage, prettyBytes } from '../utils.ts'

// This feature is needed for, e.g. https://www.npmjs.com/package/mark.js

export const description = `\
Display the "Unpacked Size" and "Total Files" columns for older packages that lack the data.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-unpacked-size-column')?.remove()
  document.querySelector('.npm-userscript-total-files-column')?.remove()
}

export async function run() {
  if (!isValidPackagePage()) return
  if (
    document.querySelector('.npm-userscript-unpacked-size-column') ||
    document.querySelector('.npm-userscript-total-files-column')
  )
    return

  const sidebarColumns = document.querySelectorAll('[aria-label="Package sidebar"] > div:has(> h3)')
  const licenseColumn = Array.from(sidebarColumns).find(
    (col) => col.querySelector('h3')?.textContent === 'License',
  )
  if (!licenseColumn) return

  const unpackedSizeColumn = Array.from(sidebarColumns).find(
    (col) => col.querySelector('h3')?.textContent === 'Unpacked Size',
  )
  const totalFilesColumn = Array.from(sidebarColumns).find(
    (col) => col.querySelector('h3')?.textContent === 'Total Files',
  )
  if (unpackedSizeColumn && totalFilesColumn) return

  const data = await fetchPackageFilesData()
  if (!data) return

  if (!totalFilesColumn) {
    const newTotalFilesColumn = licenseColumn.cloneNode(true) as HTMLElement
    newTotalFilesColumn.classList.add('npm-userscript-total-files-column')
    newTotalFilesColumn.querySelector('h3')!.textContent = 'Total Files'
    newTotalFilesColumn.querySelector('p')!.textContent = data.fileCount.toString()
    licenseColumn.insertAdjacentElement('afterend', newTotalFilesColumn)
  }

  if (!unpackedSizeColumn) {
    const newUnpackedSizeColumn = licenseColumn.cloneNode(true) as HTMLElement
    newUnpackedSizeColumn.classList.add('npm-userscript-unpacked-size-column')
    newUnpackedSizeColumn.querySelector('h3')!.textContent = 'Unpacked Size'
    newUnpackedSizeColumn.querySelector('p')!.textContent = prettyBytes(data.totalSize)
    licenseColumn.insertAdjacentElement('afterend', newUnpackedSizeColumn)
  }
}
