import { cacheResult } from './utils-cache.ts'
import { getNpmContext } from './utils-npm-context.ts'
import { getGitHubOwnerRepo, getPackageName, getPackageVersion } from './utils.ts'

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

export async function getFullRepositoryLink(): Promise<string | undefined> {
  const repository = getNpmContext().context.packument.repository
  if (!repository) return

  const packageJson = await fetchPackageJson()
  const directory = packageJson?.repository?.directory
  if (!directory) return repository

  return getRepositoryFilePath(directory)
}

export async function getRepositoryFilePath(filePath: string): Promise<string | undefined> {
  const repository = getNpmContext().context.packument.repository
  if (!repository) return

  let repositoryFilePath = repository
  if (!/\/tree\/.+$/.test(repository)) {
    // Append /tree/<default_branch>/ if no branch is specified
    const repoData = await fetchGitHubRepoData()
    if (!repoData) return
    repositoryFilePath += `/tree/${repoData.default_branch}`
  }
  if (repositoryFilePath.endsWith('/')) {
    repositoryFilePath = repositoryFilePath.slice(0, -1)
  }
  if (filePath.startsWith('/')) {
    filePath = filePath.slice(1)
  }
  if (filePath) {
    repositoryFilePath += `/${filePath}`
  }
  return repositoryFilePath
}

export async function fetchPackageFilesData(): Promise<PackageFilesData | undefined> {
  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return undefined
  // This uses the same data from the code tab
  return cacheResult(`fetchPackageFiles:${packageName}@${packageVersion}`, 60, () =>
    fetchJson(`https://www.npmjs.com/package/${packageName}/v/${packageVersion}/index`),
  )
}
export async function fetchPackageFileContent(
  hex: string,
): Promise<Record<string, any> | undefined> {
  const packageName = getPackageName()
  if (!packageName) return undefined
  // https://www.npmjs.com/package/vite/file/223635a2336dd42ac73ec67bbea116086875f640bc28fceb8846c572a496d673
  // This uses the same data from the code tab
  return cacheResult(`fetchPackageFiles:${packageName}-${hex}`, 0, () =>
    fetchJson(`https://www.npmjs.com/package/${packageName}/file/${hex}`),
  )
}

export async function fetchPackageJson(): Promise<Record<string, any> | undefined> {
  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return undefined
  return cacheResult(`fetchPackageJson:${packageName}@${packageVersion}`, 60, () =>
    fetchJson(`https://registry.npmjs.org/${packageName}/${packageVersion}`),
  )
}

export async function fetchGitHubRepoData(): Promise<Record<string, any> | undefined> {
  const ownerRepo = getGitHubOwnerRepo()
  if (!ownerRepo) return undefined
  return cacheResult(`fetchGitHubRepoData:${ownerRepo}`, 60, () =>
    fetchJson(`https://api.github.com/repos/${ownerRepo}`),
  )
}

export async function fetchGitHubPullRequestsCount(): Promise<number | undefined> {
  const ownerRepo = getGitHubOwnerRepo()
  if (!ownerRepo) return undefined
  return cacheResult(`fetchPrCount:${ownerRepo}`, 60, async () => {
    const headers = await fetchHeaders(`https://api.github.com/repos/${ownerRepo}/pulls?per_page=1`)
    // Example header:
    // ...
    // Link: <https://api.github.com/repositories/74293321/pulls?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/74293321/pulls?per_page=1&page=75>; rel="last"
    // ...
    // Fetch the last page= number
    const match =
      /<https:\/\/api\.github\.com\/repositories\/\d+\/pulls\?per_page=1&page=(\d+)>;\s*rel="last"/.exec(
        headers,
      )
    return match ? Number(match[1]) : 0
  })
}

// === GENERAL FETCH HELPERS ===

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

export function fetchStatus(
  input: string | URL | Request,
  init?: FetchRequestInit,
): Promise<number> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      ...getSharedOptions(input, init, reject),
      method: 'HEAD',
      onreadystatechange: (response) => {
        if (response.readyState === 2) {
          resolve(response.status)
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
