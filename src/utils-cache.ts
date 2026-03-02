const CACHE_PREFIX = 'npm-userscript:'

export const cache = {
  set: setCache,
  get: getCache,
  clear: clearCache,
  clearByPrefix: clearCacheByPrefix,
  clearExpired: clearExpiredCache,
  hasByPrefix: hasCacheByPrefix,
}

function setCache(key: string, value: string, expirySeconds?: number) {
  key = CACHE_PREFIX + key

  const data = {
    value,
    expireOn: expirySeconds ? Date.now() + expirySeconds * 1000 : null,
  }

  localStorage.setItem(key, JSON.stringify(data))
}

function getCache(key: string): string | null {
  key = CACHE_PREFIX + key

  const cached = localStorage.getItem(key)
  if (!cached) return null

  const { value, expireOn } = JSON.parse(cached)
  if (expireOn && Date.now() >= expireOn) {
    localStorage.removeItem(key)
    return null
  }

  return value
}

function clearCache(key: string) {
  key = CACHE_PREFIX + key
  localStorage.removeItem(key)
}

function clearCacheByPrefix(prefix: string, except?: string[]) {
  prefix = CACHE_PREFIX + prefix
  except = except?.map((k) => CACHE_PREFIX + k)
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(prefix) && !except?.includes(key)) {
      localStorage.removeItem(key)
    }
  })
}

function clearExpiredCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      const cached = localStorage.getItem(key)
      if (cached) {
        const expiredOn = /"expireOn":(\d+|null)}$/.exec(cached)?.[1]
        if (expiredOn && expiredOn !== 'null' && Date.now() >= Number(expiredOn)) {
          localStorage.removeItem(key)
        }
      }
    }
  })
}

function hasCacheByPrefix(prefix: string): boolean {
  prefix = CACHE_PREFIX + prefix
  return Object.keys(localStorage).some((key) => key.startsWith(prefix))
}

const _inMemoryCache: Record<string, any> = {}
export function cacheResult<T>(
  key: string,
  duration: number,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  if (key in _inMemoryCache) {
    return _inMemoryCache[key]
  }

  if (duration > 0) {
    const cached = cache.get(key)
    // If `fn` returns undefined, we should return undefined instead of parsing (which errors).
    if (cached === undefined) return undefined as T
    if (cached !== null) return JSON.parse(cached) as T
  }

  const result = fn()
  _inMemoryCache[key] = result
  // @ts-expect-error
  if (result.then) {
    // @ts-expect-error
    result.then((resolved) => {
      _inMemoryCache[key] = resolved
      if (duration > 0) {
        cache.set(key, JSON.stringify(resolved), duration)
      }
    })
  } else {
    if (duration > 0) {
      cache.set(key, JSON.stringify(result), duration)
    }
  }
  return result
}
