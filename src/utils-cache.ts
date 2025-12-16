export const cache = {
  set: setCache,
  get: getCache,
  clear: clearCache,
  clearByPrefix: clearCacheByPrefix,
  hasByPrefix: hasCacheByPrefix,
}

function setCache(key: string, value: string, expirySeconds?: number) {
  key = 'npm-userscript:' + key

  const data = {
    value,
    expireOn: expirySeconds ? Date.now() + expirySeconds * 1000 : null,
  }

  localStorage.setItem(key, JSON.stringify(data))
}

function getCache(key: string): string | null {
  key = 'npm-userscript:' + key

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
  key = 'npm-userscript:' + key
  localStorage.removeItem(key)
}

function clearCacheByPrefix(prefix: string) {
  prefix = 'npm-userscript:' + prefix
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  })
}

function hasCacheByPrefix(prefix: string): boolean {
  prefix = 'npm-userscript:' + prefix
  return Object.keys(localStorage).some((key) => key.startsWith(prefix))
}
