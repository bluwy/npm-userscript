import { getFullRepositoryLink } from '../utils-fetch.ts'
import { isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Adds the repository directory to the repository link.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document
    .querySelector('a[aria-labelledby*=repository-link]')
    ?.classList.remove('npm-userscript-repository-directory')
}

export async function run() {
  if (!isValidPackagePage()) return
  if (!document.querySelector('.npm-userscript-repository-directory')) return

  const el = document.querySelector<HTMLAnchorElement>('a[aria-labelledby*=repository-link]')
  const textEl = document.getElementById('repository-link')
  if (!el || !textEl) return

  const fullRepositoryLink = await getFullRepositoryLink()
  if (!fullRepositoryLink) return
  if (el.href === fullRepositoryLink) return

  el.href = fullRepositoryLink
  textEl.textContent = fullRepositoryLink.replace(/^https?:\/\//, '')
  el.classList.add('npm-userscript-repository-directory')
}
