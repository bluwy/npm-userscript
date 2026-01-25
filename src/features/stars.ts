import { fetchGitHubRepoData } from '../utils-fetch.ts'
import { addStyle, isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Display a "Stars" column in the package sidebar for GitHub repos.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-stars-column')?.remove()
}

export async function runPre() {
  if (!isValidPackagePage()) return
  // Info will be in the card, no need to render
  if ((await getFeatureSettings())['repository-card'].get() === true) return

  addStyle(`
    .npm-userscript-stars-link {
      text-decoration: none;
    }

    .npm-userscript-stars-link:focus,
    .npm-userscript-stars-link:hover {
      text-decoration: underline;
      color: #cb3837;
    }
  `)
}

export async function run() {
  if (!isValidPackagePage()) return
  // Info will be in the card, no need to render
  if ((await getFeatureSettings())['repository-card'].get() === true) return
  if (document.querySelector('.npm-userscript-stars-column')) return

  const sidebarColumns = document.querySelectorAll('[aria-label="Package sidebar"] > div:has(> h3)')
  const ref = Array.from(sidebarColumns).find(
    (col) => col.querySelector('h3')?.textContent === 'Total Files',
  )
  if (!ref) return

  const data = await fetchGitHubRepoData()
  if (!data) return

  const link = `https://github.com/${data.full_name}/stargazers`
  const count = data.stargazers_count.toLocaleString()

  const cloned = ref.cloneNode(true) as HTMLElement
  cloned.classList.add('npm-userscript-stars-column')
  cloned.classList.remove('w-100')
  cloned.querySelector('h3')!.textContent = 'Stars'
  const linkHtml = `<a class="npm-userscript-stars-link" href="${link}">${count}</a>`
  cloned.querySelector('p')!.innerHTML = linkHtml
  ref.insertAdjacentElement('afterend', cloned)
}

async function getFeatureSettings() {
  const settings = await import('../settings.ts')
  return settings.featureSettings
}
