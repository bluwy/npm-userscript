const HYDRATION_DELAY_MS = 50

let pageAlreadyReady = false
export async function waitForPageReady(): Promise<void> {
  if (!pageAlreadyReady) {
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve()
      } else {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
      }
    })
  }
  // Additionally, wait for npm to hydrate
  await new Promise((resolve) => setTimeout(resolve, HYDRATION_DELAY_MS))
  pageAlreadyReady = true
}

const onNavigateListeners: Function[] = []
export function listenNavigate(listener: () => void) {
  let lastHref = location.href

  if (onNavigateListeners.length === 0) {
    // Because we're using `inject-into: content`, we can't detect the page has navigated via
    // history api. We need to do some lame detection.
    document.addEventListener('click', () => {
      setTimeout(() => {
        if (location.href !== lastHref) {
          lastHref = location.href
          onNavigateListeners.forEach((l) => l())
        }
      }, 100)
    })
  }

  onNavigateListeners.push(() => {
    // Delay to allow npm to render the new content. Sucks to hardcode but couldn't find a better way.
    setTimeout(() => listener(), HYDRATION_DELAY_MS)
  })
}
