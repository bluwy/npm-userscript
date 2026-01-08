import getNpmTarballUrl from 'get-npm-tarball-url'
import { getPackageName, getPackageVersion, isValidPackagePage, prettyBytes } from '../utils.ts'

export const description = `\
Display the tarball size of the package
`

export async function run() {
  if (!isValidPackagePage()) return

  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return

  const tarballSize = await getTarballSize(packageName, packageVersion)
  if (!tarballSize) return

  // Inject after the "Unpacked size" column
  const sidebarColumns = document.querySelectorAll('[aria-label="Package sidebar"] > div:has(> h3)')
  const unpackedSizeColumn = Array.from(sidebarColumns).find(
    (col) => col.querySelector('h3')?.textContent === 'Unpacked Size',
  )
  if (!unpackedSizeColumn) return

  const tarballSizeColumn = unpackedSizeColumn.cloneNode(true) as HTMLElement
  tarballSizeColumn.querySelector('h3')!.textContent = 'Tarball Size'
  tarballSizeColumn.querySelector('p')!.textContent = tarballSize
  unpackedSizeColumn.insertAdjacentElement('afterend', tarballSizeColumn)
}

async function getTarballSize(
  packageName: string,
  packageVersion: string,
): Promise<string | undefined> {
  const controller = new AbortController()

  const result = await fetch(getNpmTarballUrl(packageName, packageVersion), {
    method: 'GET',
    signal: controller.signal,
  })

  // Immediately abort, we just want to read headers. We use GET and not HEAD in this case
  // because npm doesn't return the Content-Length for the HEAD requests.
  controller.abort()

  const contentLength = result.headers.get('Content-Length')
  if (!contentLength) return undefined

  return prettyBytes(parseInt(contentLength, 10))
}
