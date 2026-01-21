let _npmContext: any = null
let _npmContextWaitPromise: Promise<void> | null = null

/**
 * Get the `window.__context__` object from the npm page
 */
export function getNpmContext() {
  if (_npmContext == null) {
    throw new Error('Npm context not yet extracted')
  }
  return _npmContext
}

function listenNpmContextCode() {
  // @ts-expect-error
  if (window.__context__ != null) {
    window.dispatchEvent(
      new CustomEvent('npm-userscript-npm-context:init', {
        // @ts-expect-error
        detail: JSON.stringify(window.__context__),
      }),
    )
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        window.dispatchEvent(
          new CustomEvent('npm-userscript-npm-context:init', {
            // @ts-expect-error
            detail: JSON.stringify(window.__context__),
          }),
        )
      },
      { once: true },
    )
  }

  // Patch XMLHttpRequest to capture future context changes
  const origOpen = XMLHttpRequest.prototype.open
  const origSend = XMLHttpRequest.prototype.send

  // @ts-expect-error Patch open to store the request URL
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    // @ts-expect-error
    this._npmUserscriptRequestUrl = typeof url === 'string' ? url : null
    // @ts-expect-error
    if (this._npmUserscriptRequestUrl.startsWith('/')) {
      window.dispatchEvent(new CustomEvent('npm-userscript-npm-context:wait-update'))
    }
    // @ts-expect-error
    return origOpen.call(this, method, url, ...rest)
  }

  // Patch send to intercept after request completes
  XMLHttpRequest.prototype.send = function (...args) {
    // @ts-expect-error
    if (this._npmUserscriptRequestUrl && this._npmUserscriptRequestUrl.startsWith('/')) {
      this.addEventListener('load', function () {
        const text = this.responseText
        if (text.startsWith('{"')) {
          const context = JSON.parse(text)
          // @ts-expect-error
          const __context__ = { ...window.__context__, context }
          window.dispatchEvent(
            new CustomEvent('npm-userscript-npm-context:update', {
              detail: JSON.stringify(__context__),
            }),
          )
        }
      })
    }
    return origSend.apply(this, args)
  }
}

// init function
export function listenNpmContext() {
  // @ts-expect-error
  window.addEventListener(
    'npm-userscript-npm-context:init',
    (event: CustomEvent) => {
      _npmContext = JSON.parse(event.detail)
    },
    { once: true },
  )

  let _resolve: (() => void) | null = null
  window.addEventListener('npm-userscript-npm-context:wait-update', () => {
    _npmContextWaitPromise = new Promise<void>((resolve) => {
      _resolve = resolve
    })
  })
  // @ts-expect-error
  window.addEventListener('npm-userscript-npm-context:update', (event: CustomEvent) => {
    _npmContext = JSON.parse(event.detail)
    _resolve?.()
  })

  const script = document.createElement('script')
  script.textContent = `(${listenNpmContextCode.toString()})()`
  document.body.appendChild(script)
}

export async function waitForNpmContextReady(): Promise<void> {
  if (_npmContextWaitPromise) return _npmContextWaitPromise

  return new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      if (_npmContext != null) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 100)
  })
}
