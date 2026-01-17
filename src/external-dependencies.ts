import type { ModuleReplacement } from 'module-replacements'

// https://github.com/es-tooling/module-replacements
export async function getModuleReplacements(): Promise<ModuleReplacement[]> {
  const results = [
    fetchJson('https://cdn.jsdelivr.net/npm/module-replacements@2/manifests/micro-utilities.json'),
    fetchJson('https://cdn.jsdelivr.net/npm/module-replacements@2/manifests/native.json'),
    fetchJson('https://cdn.jsdelivr.net/npm/module-replacements@2/manifests/preferred.json'),
  ]

  const [microUtilities, native, preferred] = await Promise.all(results)

  return [
    ...microUtilities.moduleReplacements,
    ...native.moduleReplacements,
    ...preferred.moduleReplacements,
  ]
}

export function fetchJson<T = any>(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const url = input instanceof Request ? input.url : input.toString()
    const method = init?.method || 'GET'
    const headers =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers as Record<string, string> | undefined)
    const data = init?.body?.toString() ?? undefined

    GM.xmlHttpRequest({
      ...init,
      url,
      // @ts-expect-error
      method,
      headers,
      data,
      responseType: 'json',
      onload: (response) => {
        if (response.status >= 200 && response.status < 300) {
          resolve(response.response as T)
        } else {
          resolve(undefined)
        }
      },
      onerror: (err) => reject(err),
      ontimeout: () => reject(new Error('Request timed out')),
      onabort: () => reject(new Error('Request aborted')),
    })
  })
}

export function fetchHeaders(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const url = input instanceof Request ? input.url : input.toString()
    const method = init?.method || 'GET'
    const headers =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers as Record<string, string> | undefined)
    const data = init?.body?.toString() ?? undefined

    const req = GM.xmlHttpRequest({
      ...init,
      url,
      // @ts-expect-error
      method,
      headers,
      data,
      onreadystatechange: (response) => {
        if (response.readyState === 2) {
          // @ts-expect-error untyped
          req.abort()
          resolve(response.responseHeaders)
        }
      },
      onerror: (err) => reject(err),
      ontimeout: () => reject(new Error('Request timed out')),
      onabort: () => reject(new Error('Request aborted')),
    })
  })
}
