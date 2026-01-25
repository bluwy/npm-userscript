import { getFullRepositoryLink } from '../utils-fetch.ts'
import { isValidPackagePage } from '../utils.ts'

export const description = `\
Adds the repository directory to the repository link.
`

export async function run() {
  if (!isValidPackagePage()) return

  const el = document.querySelector<HTMLAnchorElement>('a[aria-labelledby*=repository-link]')
  const textEl = document.getElementById('repository-link')
  if (!el || !textEl) return

  const fullRepositoryLink = await getFullRepositoryLink()
  if (!fullRepositoryLink) return

  el.href = fullRepositoryLink
  textEl.textContent = fullRepositoryLink.replace(/^https?:\/\//, '')
}
