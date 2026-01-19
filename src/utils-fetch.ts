import { inMemoryCache } from './utils-cache.ts'
import { getPackageName, getPackageVersion } from './utils.ts'

export interface PackageFilesData {
  totalSize: number
  fileCount: number
  files: Record<string, PackageFilesDataFile>
  integrity: string
  shasum: string
}

export interface PackageFilesDataFile {
  type: 'File'
  contentType: string
  path: string
  size: number
  linesCount: number
  hex: string
  isBinary: string // "true" | "false" (amazing npm)
}

export async function fetchPackageFilesData(): Promise<PackageFilesData | undefined> {
  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return undefined
  // This uses the same data from the code tab
  return inMemoryCache(`fetchPackageFiles:${packageName}@${packageVersion}`, () =>
    fetchJson(`https://www.npmjs.com/package/${packageName}/v/${packageVersion}/index`),
  )
}
export async function fetchPackageFileContent(hex: string): Promise<string | undefined> {
  const packageName = getPackageName()
  if (!packageName) return undefined
  // https://www.npmjs.com/package/vite/file/223635a2336dd42ac73ec67bbea116086875f640bc28fceb8846c572a496d673
  // This uses the same data from the code tab
  return inMemoryCache(`fetchPackageFiles:${packageName}-${hex}`, () =>
    fetchJson(`https://www.npmjs.com/package/${packageName}/file/${hex}`),
  )
}

export async function fetchPackageJson(): Promise<Record<string, any> | undefined> {
  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return undefined
  return inMemoryCache(`fetchPackageJson:${packageName}@${packageVersion}`, () =>
    fetchJson(`https://registry.npmjs.org/${packageName}/${packageVersion}`),
  )
}

export interface FetchRequestInit extends Pick<RequestInit, 'method' | 'headers' | 'body'> {}

export function fetchText(input: string | URL | Request, init?: FetchRequestInit): Promise<string> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      ...getSharedOptions(input, init, reject),
      responseType: 'text',
      onload: (response) => {
        resolve(response.responseText)
      },
    })
  })
}

export function fetchJson<T = any>(
  input: string | URL | Request,
  init?: FetchRequestInit,
): Promise<T> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      ...getSharedOptions(input, init, reject),
      responseType: 'json',
      onload: (response) => {
        resolve(response.response as T)
      },
    })
  })
}

export function fetchHeaders(
  input: string | URL | Request,
  init?: FetchRequestInit,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = GM.xmlHttpRequest({
      ...getSharedOptions(input, init, reject),
      onreadystatechange: (response) => {
        if (response.readyState === 2) {
          // @ts-expect-error untyped
          req.abort()
          resolve(response.responseHeaders)
        }
      },
    })
  })
}

function getSharedOptions(
  input: string | URL | Request,
  init: FetchRequestInit | undefined,
  reject: (reason?: any) => void,
): GM.Request {
  return {
    ...init,
    url: input instanceof Request ? input.url : input.toString(),
    // @ts-expect-error
    method: init?.method || 'GET',
    headers: init?.headers
      ? init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : Array.isArray(init.headers)
          ? Object.fromEntries(init.headers)
          : init.headers
      : undefined,
    data: init?.body?.toString() ?? undefined,
    onerror: (err) => reject(err),
    ontimeout: () => reject(new Error('Request timed out')),
    onabort: () => reject(new Error('Request aborted')),
  }
}
