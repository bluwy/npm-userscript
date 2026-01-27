import * as packedSize from './routes/packed-size.ts'
import * as vulnerabilities from './routes/vulnerabilities.ts'
import type { RouteHandler } from './types.ts'

const routes: { handler: RouteHandler }[] = [packedSize, vulnerabilities]

export default {
  async fetch(request, env, ctx): Promise<Response> {
    for (const route of routes) {
      const response = await route.handler(request, env, ctx)
      if (response) return response
    }
    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
