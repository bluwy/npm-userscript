import { getNpmContext } from './utils-npm-context.ts'

const styles: string[] = []
let allStyles = ''

/**
 * Adds a style to the page. If the same css is added multiple times, it will only be included once.
 */
export function addStyle(css: string) {
  css = css.trim()
  if (styles.includes(css) || allStyles.includes(css)) return
  styles.push(css)
}

export function consolidateStyles() {
  const style = document.createElement('style')
  const combinedStyles = styles.join('\n')
  style.textContent = combinedStyles
  allStyles += combinedStyles
  document.head.appendChild(style)
  styles.length = 0
}

export async function waitForElement(selector: string, timeout = 1000): Promise<HTMLElement> {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) return element

  return new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      clearInterval(queryTimer)
      clearInterval(timeoutTimer)
      reject(new Error(`Timeout waiting for element: ${selector}`))
    }, timeout)

    const queryTimer = setInterval(() => {
      const element = document.querySelector<HTMLElement>(selector)
      if (element) {
        clearInterval(queryTimer)
        clearTimeout(timeoutTimer)
        resolve(element)
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

export function isSamePackagePage(previousUrl: string): boolean {
  const previousPathname = new URL(previousUrl).pathname
  const newPathname = location.pathname
  return previousPathname === newPathname
}

export function getGitHubOwnerRepo(): string | undefined {
  const repositoryLink = getNpmContext().context.packument.repository
  return /github\.com\/([^\/]+\/[^\/]+)/.exec(repositoryLink)?.[1]
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

let lastColumnH3Text: string | null = null

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
    lastColumnH3Text = lastColumn.querySelector('h3')?.textContent || null
  }
}

export function teardownSidebarBalance() {
  if (lastColumnH3Text) {
    const columns = document.querySelectorAll('[aria-label="Package sidebar"] div.w-50.w-100')
    const lastColumn = Array.from(columns).find(
      (col) => col.querySelector('h3')?.textContent === lastColumnH3Text,
    )
    lastColumn?.classList.remove('w-100')
    lastColumnH3Text = null
  }
}
