declare global {
  interface Window {
    __context__: any
  }
}

const styles: string[] = []

export function addStyle(css: string) {
  styles.push(css.trim())
}

export function consolidateStyles() {
  const style = document.createElement('style')
  style.textContent = styles.join('\n')
  document.head.appendChild(style)
  styles.length = 0
}

export async function waitForPageReady(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve()
    } else {
      listenOnce('DOMContentLoaded', () => resolve())
    }
  })
  await extractNpmContext()
  // Additionally, wait for npm to hydrate
  await new Promise((resolve) => setTimeout(resolve, 100))
}

export function listenOnce<K extends keyof DocumentEventMap>(
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
) {
  document.addEventListener(type, listener, { once: true })
}

export function getPackageName(): string | undefined {
  if (!location.pathname.startsWith('/package/')) return undefined

  const str = location.pathname.slice('/package/'.length)
  const parts = str.split('/')
  if (str[0] === '@') {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : undefined
  } else {
    return parts[0] || undefined
  }
}

export function getPackageVersion(): string | undefined {
  if (!location.pathname.startsWith('/package/')) return undefined

  // Match /v/version in the URL
  const match = /\/v\/(.+?)(?:$|\/|\?|#)/.exec(location.pathname)
  if (match) return match[1]

  // Otherwise, extract from internal variable
  try {
    return unsafeWindow.__context__.context.packageVersion.version
  } catch {}

  // Could actually try to read the html element but meh
}

export function isValidPackagePage(): boolean {
  return (
    location.pathname.startsWith('/package/') &&
    // if is a valid package, should be like "package-name - npm"
    document.title !== 'npm'
  )
}

export function prettyBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  // NOTE: We use lowercase-k and uppercase for the rest to follow npmjs.com style.
  // Lowercase is technically correct because we calculate by 1000, but.. npm
  const units = ['kB', 'MB', 'GB', 'TB']
  let i = -1
  do {
    bytes *= 0.001
    i++
  } while (bytes >= 1000 && i < units.length - 1)
  return `${bytes.toFixed(2)} ${units[i]}`
}

const onNavigateListeners: Function[] = []
export function listenNavigate(listener: () => void) {
  if (onNavigateListeners.length === 0) {
    const _pushState = history.pushState
    const _replaceState = history.replaceState

    history.pushState = function (...args) {
      _pushState.apply(this, args)
      onNavigateListeners.forEach((l) => l())
    }

    history.replaceState = function (...args) {
      _replaceState.apply(this, args)
      onNavigateListeners.forEach((l) => l())
    }

    window.addEventListener('popstate', () => {
      onNavigateListeners.forEach((l) => l())
    })
  }

  onNavigateListeners.push(() => {
    // Delay to allow npm to render the new content. Sucks to hardcode but couldn't find a better way.
    setTimeout(() => listener(), 100)
  })
}

/**
 * The sidebar has two-column layout that may have a row only with one column when we inject
 * additional data, which causes the separator to be halved. This function with fix that by
 * extending the column
 */
export function ensureSidebarBalance() {
  const sidebar = document.querySelector('[aria-label="Package sidebar"]')
  if (!sidebar) return

  const halfWidthColumns = sidebar.querySelectorAll('div.w-50:not(.w-100)')
  if (halfWidthColumns.length % 2 === 1) {
    const lastColumn = halfWidthColumns[halfWidthColumns.length - 1]
    lastColumn.classList.add('w-100')
  }
}

// We need to do this shit because Safari Userscripts does not expose unsafeWindow. We need the `__context__`.
async function extractNpmContext() {
  return new Promise((resolve) => {
    const elementId = 'npm-userscript-context'
    const elementEvent = 'npm-userscript-done'
    const script = document.createElement('script')
    script.id = elementId
    script.textContent = `
      document.getElementById('${elementId}').dataset.value = JSON.stringify(window.__context__)
      document.getElementById('${elementId}').dispatchEvent(new Event('${elementEvent}'))
    `
    script.addEventListener(
      elementEvent,
      () => {
        const context = JSON.parse(script.dataset.value || '{}')
        script.remove()
        window.__context__ = context
        window.unsafeWindow = window
        resolve(context)
      },
      { once: true },
    )
    document.body.appendChild(script)
  })
}
