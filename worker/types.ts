export type RouteHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) => Response | undefined | Promise<Response | undefined>
