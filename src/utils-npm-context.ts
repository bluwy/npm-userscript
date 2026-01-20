let _npmContext: any = null

/**
 * Get the `window.__context__` object from the npm page
 */
export function getNpmContext() {
  if (_npmContext == null) {
    throw new Error('Npm context not yet extracted')
  }
  return _npmContext
}

// In many userscripts we can't rely on `unsafeWindow` to access page variables, so we need to do
// this trick to extract the stuff we need.
export async function extractNpmContext() {
  return new Promise<void>((resolve) => {
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
        _npmContext = JSON.parse(script.dataset.value || '{}')
        script.remove()
        resolve()
      },
      { once: true },
    )
    document.body.appendChild(script)
  })
}
