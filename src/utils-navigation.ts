const HYDRATION_DELAY_MS = 50

// Some userscript managers allow executing a lot early than expected. We need at least the DOM ready in our script.
export async function waitForDocumentPartiallyReady(): Promise<void> {
  // wait for document.body to be not null
  if (!document.body) {
    await new Promise<void>((resolve, reject) => {
      let max = 40 // 40 * 50ms = 2s max
      setInterval(() => {
        if (document.body) {
          resolve()
        } else if (max-- <= 0) {
          reject(new Error('[npm-userscript] Document took too long to be ready'))
        }
      }, 50)
    })
  }
}

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

export type NavigateListener = (previousUrl: string) => void

const onNavigateListeners: NavigateListener[] = []

function listenNavigateCode() {
  const pushState = history.pushState
  history.pushState = function () {
    // @ts-expect-error
    pushState.apply(this, arguments)
    window.dispatchEvent(new Event('npm-userscript-navigate'))
  }
  const replaceState = history.replaceState
  history.replaceState = function () {
    // @ts-expect-error
    replaceState.apply(this, arguments)
    window.dispatchEvent(new Event('npm-userscript-navigate'))
  }
  window.addEventListener('popstate', function () {
    window.dispatchEvent(new Event('npm-userscript-navigate'))
  })
}

export function listenNavigate(listener: NavigateListener) {
  let lastHref = location.href

  if (onNavigateListeners.length === 0) {
    const script = document.createElement('script')
    script.textContent = `(${listenNavigateCode.toString()})()`
    document.head.appendChild(script)

    window.addEventListener('npm-userscript-navigate', () => {
      if (location.href === lastHref) return
      onNavigateListeners.forEach((l) => l(lastHref))
      lastHref = location.href
    })
  }

  onNavigateListeners.push((previousUrl: string) => {
    // Delay to allow npm to render the new content. Sucks to hardcode but couldn't find a better way.
    setTimeout(() => listener(previousUrl), HYDRATION_DELAY_MS)
  })
}
