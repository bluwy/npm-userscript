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

export function isValidPackagePage(): boolean {
  return (
    location.pathname.startsWith('/package/') &&
    // if is a valid package, should be like "package-name - npm"
    document.title !== 'npm'
  )
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
