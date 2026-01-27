import getNpmTarballUrl from 'get-npm-tarball-url'
import type { RouteHandler } from '../types.ts'

export const handler: RouteHandler = async (request, env, ctx) => {
  const url = new URL(request.url)
  // Accept /packed-size/foo@1.2.3 or /packed-size/@foo/bar@1.2.3
  const match = url.pathname.match(/^\/packed-size\/(.+)$/)
  if (!match) return

  const { packageName, packageVersion } = getPackageNameAndVersion(match[1])
  if (!packageVersion) {
    return new Response('Package version is required', { status: 400 })
  }

  const key = `${packageName}@${packageVersion}`
  const cached = await env.NPM_PACKED_SIZE.get(key)
  if (cached) {
    return respondWithSize(cached)
  }

  // We only need the Content-Length header, and npm only returns this for GET requests, so do
  // a quick fetch like this.
  //
  // According to Copilot, Cloudflare Workers body fetching may be less aggresive and would not
  // stream the body if we don't read it, however, it cannot provide any proof of that, so we
  // will just abort to be safe.
  const abortController = new AbortController()
  const result = await fetch(getNpmTarballUrl(packageName, packageVersion), {
    signal: abortController.signal,
  })
  const contentLength = result.headers.get('content-length')
  await result.body?.cancel()
  abortController.abort()
  const size = contentLength ? parseInt(contentLength, 10) : undefined

  if (size === undefined || isNaN(size)) {
    return new Response('Could not determine package size', { status: 500 })
  }
  const sizeStr = size.toString()

  ctx.waitUntil(env.NPM_PACKED_SIZE.put(key, sizeStr))

  return respondWithSize(sizeStr)
}

function getPackageNameAndVersion(id: string) {
  const splittedId = id.split('@')

  let packageName: string
  let packageVersion: string | undefined
  if (id.startsWith('@')) {
    packageName = splittedId.slice(0, 2).join('@')
    packageVersion = splittedId[2]
  } else {
    packageName = splittedId[0]
    packageVersion = splittedId[1]
  }

  // In case it's "foo@latest" or something
  if (packageVersion && !/^\d/.test(packageVersion)) {
    packageVersion = undefined
  }

  return { packageName, packageVersion }
}

function respondWithSize(sizeStr: string) {
  return new Response(sizeStr, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=31557600, immutable',
      // For now this API is really simple and unlikely to change, so allow everyone to use
      'Access-Control-Allow-Origin': '*',
    },
  })
}
