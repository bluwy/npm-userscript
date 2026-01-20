import { getNpmContext } from './utils-npm-context.ts'

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

export async function waitForElement(selector: string, timeout = 1000): Promise<void> {
  if (document.querySelector(selector)) return

  return new Promise<void>((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      clearInterval(queryTimer)
      clearInterval(timeoutTimer)
      reject(new Error(`Timeout waiting for element: ${selector}`))
    }, timeout)

    const queryTimer = setInterval(() => {
      if (document.querySelector(selector)) {
        clearInterval(queryTimer)
        clearTimeout(timeoutTimer)
        resolve()
      }
    }, 100)
  })
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
  return getNpmContext().context.packageVersion.version
}

export function isValidPackagePage(): boolean {
  return (
    location.pathname.startsWith('/package/') &&
    // if is a valid package, should be like "package-name - npm"
    document.title !== 'npm'
  )
}

export function getNpmTarballUrl() {
  const packument = getNpmContext().context.packument
  const versionData = packument.versions.find((v: any) => (v.version = packument.version))
  return versionData.dist.tarball as string
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
  const unit = units[i]
  const num = unit === 'kB' ? Math.round(bytes) : bytes.toFixed(2)
  return `${num} ${unit}`
}

/**
 * The sidebar has two-column layout that may have a row only with one column when we inject
 * additional data, which causes the separator to be halved. This function with fix that by
 * extending the column
 */
export function ensureSidebarBalance() {
  const halfWidthColumns = document.querySelectorAll(
    '[aria-label="Package sidebar"] div.w-50:not(.w-100)',
  )
  if (halfWidthColumns.length % 2 === 1) {
    const lastColumn = halfWidthColumns[halfWidthColumns.length - 1]
    lastColumn.classList.add('w-100')
  }
}
