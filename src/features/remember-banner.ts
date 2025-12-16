import { addStyle } from '../utils.ts'

export const description = `\
Remember the banner at the top of the page when dismissed, so it doesn't keep showing up.
`
// Because it was too hard to implement

const bannerPrefix = 'npm-userscript-remember-banner:'
const getBannerKey = (banner: Element) => {
  const text = banner.textContent.trim()
  const hash = btoa(encodeURIComponent(text)).slice(0, 16) + text.length
  return `${bannerPrefix}${hash}`
}

export function runPre() {
  // Pre-emptively hide the banner if we've previously closed any of it. We can't check the banner
  // element here as it might not exist yet.

  const wasClosed = Object.keys(localStorage).some(
    (key) => key.startsWith(bannerPrefix) && localStorage.getItem(key) === 'hide',
  )

  if (wasClosed) {
    addStyle(`
      section[aria-label="Site notifications"] {
        display: none;
      }
    `)
  }
}

export function run() {
  const banner = document.querySelector<HTMLElement>('section[aria-label="Site notifications"]')
  if (!banner) return

  const key = getBannerKey(banner)

  if (localStorage.getItem(key) === 'hide') {
    banner.remove()
  } else {
    banner.style.display = 'block'
    const closeButton = banner.querySelector('button')
    closeButton?.addEventListener('click', () => {
      localStorage.setItem(key, 'hide')
    })
  }
}
