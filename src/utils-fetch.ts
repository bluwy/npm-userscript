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
