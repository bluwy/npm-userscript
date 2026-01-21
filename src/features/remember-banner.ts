import { cache } from '../utils-cache.ts'
import { addStyle } from '../utils.ts'

export const description = `\
Remember the banner at the top of the page when dismissed, so it doesn't keep showing up.
`
// Because it was too hard to implement

const bannerPrefix = 'remember-banner:'
const getBannerKey = (banner: Element) => {
  const text = banner.textContent.trim()
  const hash = btoa(encodeURIComponent(text)).slice(0, 16) + text.length
  return `${bannerPrefix}${hash}`
}

// We can use a shared inited variable since the banner is site-wide
let inited = false

export function runPre() {
  if (inited) return
  inited = true

  // Pre-emptively hide the banner if we've previously closed any of it. We can't check the banner
  // element here as it might not exist yet.

  const wasClosed = cache.hasByPrefix(bannerPrefix)

  if (wasClosed) {
    addStyle(`
      section[aria-label="Site notifications"] {
        display: none;
      }
    `)
  }
}

export function run() {
  if (inited) return

  const banner = document.querySelector<HTMLElement>('section[aria-label="Site notifications"]')
  if (!banner) return

  const key = getBannerKey(banner)

  if (cache.get(key) === 'hide') {
    banner.remove()
  } else {
    banner.style.display = 'block'
    const closeButton = banner.querySelector('button')
    closeButton?.addEventListener('click', () => {
      cache.set(key, 'hide')
    })
  }

  // Cleanup old keys
  cache.clearByPrefix(bannerPrefix, [key])
}
