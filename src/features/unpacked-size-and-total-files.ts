import { getPackageName, getPackageVersion, isValidPackagePage, prettyBytes } from '../utils.ts'

export const description = `\
Display the "Unpacked Size" and "Total Files" columns for older packages that lack the data.
`

export async function run() {
  if (!isValidPackagePage()) return

  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return

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

  const data = await getData(packageName, packageVersion)

  if (!totalFilesColumn) {
    const newTotalFilesColumn = licenseColumn.cloneNode(true) as HTMLElement
    newTotalFilesColumn.querySelector('h3')!.textContent = 'Total Files'
    newTotalFilesColumn.querySelector('p')!.textContent = data.totalFiles.toString()
    licenseColumn.insertAdjacentElement('afterend', newTotalFilesColumn)
  }

  if (!unpackedSizeColumn) {
    const newUnpackedSizeColumn = licenseColumn.cloneNode(true) as HTMLElement
    newUnpackedSizeColumn.querySelector('h3')!.textContent = 'Unpacked Size'
    newUnpackedSizeColumn.querySelector('p')!.textContent = prettyBytes(data.unpackedSize)
    licenseColumn.insertAdjacentElement('afterend', newUnpackedSizeColumn)
  }
}

async function getData(packageName: string, packageVersion: string) {
  // This uses the same data from the code tab
  const url = `https://www.npmjs.com/package/${packageName}/v/${packageVersion}/index`
  const response = await fetch(url)
  const data = await response.json()
  return {
    unpackedSize: data.totalSize,
    totalFiles: data.fileCount,
  }
}
