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
