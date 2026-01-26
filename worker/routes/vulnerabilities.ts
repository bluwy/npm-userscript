import { fromVector } from 'ae-cvss-calculator'
import type { RouteHandler } from '../types.ts'

// The osv.dev API seems to update around every 15 minutes, so we also cache for that duration
const CACHE_TTL = 15 * 60

export const handler: RouteHandler = async (request, env, ctx) => {
  const url = new URL(request.url)
  // Accept /vulnerabilities/foo or /vulnerabilities/@foo/bar
  const match = url.pathname.match(/^\/vulnerabilities\/(.+)$/)
  if (!match) return

  const packageName = match[1]
  // NOTE: Don't allow queries to bust the cache
  const cacheKey = `${url.origin}${url.pathname}`
  const cache = caches.default

  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }

  const result = await fetch('https://api.osv.dev/v1/query', {
    method: 'POST',
    body: JSON.stringify({
      package: {
        name: packageName,
        ecosystem: 'npm',
      },
    }),
  })
  const json: any = await result.json()

  let filtered: any
  if (!json.vulns || json.vulns.length === 0) {
    filtered = { vulns: [] }
  } else {
    try {
      // Pre-compute published timestamp for sorting
      for (const vuln of json.vulns) {
        vuln._publishedTimestamp = new Date(vuln.published).getTime()
      }
      filtered = {
        vulns: json.vulns
          // Sort by published date. OSV sorts by modified date by default
          .sort((a: any, b: any) => b._publishedTimestamp - a._publishedTimestamp)
          .map((vuln: any) => {
            // Skip not credible sources
            if (vuln.references.find((ref: any) => ref.url.includes('https://www.herodevs.com')))
              return

            const cvssVector = vuln.severity[0].score
            const cvss = fromVector(cvssVector)
            const score = cvss.calculateScores().overall

            // Try to get the CVE- prefix name if possible
            const id = vuln.aliases?.find((a: string) => a.startsWith('CVE-')) ?? vuln.id
            // Get the link in this preferred order
            const link = (
              vuln.references.find((ref: any) => ref.url.includes(vuln.id)) ??
              vuln.references.find((ref: any) => ref.url.includes(id)) ??
              vuln.references.find((ref: any) => ref.type === 'ADVISORY') ??
              vuln.references[0]
            ).url

            return {
              id,
              link,
              score,
              affected: vuln.affected.flatMap((aff: any) => {
                if (aff.package.name !== packageName) return []
                const arr = []
                for (const range of aff.ranges) {
                  if (range.type === 'SEMVER') {
                    const introduced = range.events.find((e: any) => e.introduced)?.introduced
                    const fixed = range.events.find((e: any) => e.fixed)?.fixed
                    if (introduced && fixed) {
                      arr.push([introduced, fixed])
                    }
                  }
                }
                return arr
              }),
            }
          })
          .filter(Boolean),
      }
    } catch (e) {
      // console.error('Error processing data', e, json)
      return new Response('Error processing data', { status: 500 })
    }
  }

  const response = Response.json(filtered, {
    headers: {
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
      'Access-Control-Allow-Origin': 'https://www.npmjs.com',
    },
  })

  ctx.waitUntil(cache.put(cacheKey, response.clone()))

  return response
}
