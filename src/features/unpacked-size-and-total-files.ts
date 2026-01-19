import { fetchPackageFilesData } from '../utils-fetch.ts'
import { isValidPackagePage, prettyBytes } from '../utils.ts'

export const description = `\
Display the "Unpacked Size" and "Total Files" columns for older packages that lack the data.
`

// This feature is needed for, e.g. https://www.npmjs.com/package/mark.js

export async function run() {
  if (!isValidPackagePage()) return

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
    newTotalFilesColumn.querySelector('h3')!.textContent = 'Total Files'
    newTotalFilesColumn.querySelector('p')!.textContent = data.fileCount.toString()
    licenseColumn.insertAdjacentElement('afterend', newTotalFilesColumn)
  }

  if (!unpackedSizeColumn) {
    const newUnpackedSizeColumn = licenseColumn.cloneNode(true) as HTMLElement
    newUnpackedSizeColumn.querySelector('h3')!.textContent = 'Unpacked Size'
    newUnpackedSizeColumn.querySelector('p')!.textContent = prettyBytes(data.totalSize)
    licenseColumn.insertAdjacentElement('afterend', newUnpackedSizeColumn)
  }
}
