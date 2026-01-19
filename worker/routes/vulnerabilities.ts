import { fromVector } from 'ae-cvss-calculator'
import type { RouteHandler } from '../types.ts'

export const handler: RouteHandler = async (request) => {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/vulnerabilities\/([^/]+)$/)
  if (!match) return

  const packageName = match[1]
  const osvUrl = 'https://api.osv.dev/v1/query'
  const body = JSON.stringify({
    package: {
      name: packageName,
      ecosystem: 'npm',
    },
  })
  const result = await fetch(osvUrl, {
    method: 'POST',
    body,
  })
  const json: any = await result.json()

  let filtered: any
  try {
    filtered = {
      vulns: json.vulns.map((vuln: any) => {
        const cvssVector = vuln.severity[0].score
        const cvss = fromVector(cvssVector)
        const score = cvss.calculateScores().overall

        return {
          id: vuln.id,
          link: vuln.references.find((ref: any) => ref.type === 'ADVISORY').url,
          score,
          affected: vuln.affected.flatMap((aff: any) => {
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
      }),
    }
  } catch (e) {
    // console.error('Error processing data', e)
    return new Response('Error processing data', { status: 500 })
  }

  return Response.json(filtered)
}
