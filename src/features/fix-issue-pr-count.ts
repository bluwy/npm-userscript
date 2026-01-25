import { cache, cacheResult } from '../utils-cache.ts'
import { fetchGitHubRepoData, fetchHeaders, fetchJson } from '../utils-fetch.ts'
import {
  addStyle,
  getGitHubOwnerRepo,
  isSamePackagePage,
  isValidPackagePage,
  waitForElement,
} from '../utils.ts'

export const description = `\
Show "Issue" and "Pull Requests" counts in the package sidebar. At the time of writing, npm's own
implementation is broken for large numbers for some reason. This temporarily fixes it.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelectorAll('.npm-userscript-issue-pr-count').forEach((el) => el.remove())
}

export function runPre() {
  if (!isValidPackagePage()) return

  addStyle(`
    #issues + p,
    #pulls + p {
      padding: 0;
      margin: 0;
    }

    #issues + p > a,
    #pulls + p > a {
      font-size: 1.25rem;
    }
  `)

  addStyle(`
    .npm-userscript-issue-pr-link {
      text-decoration: none;
    }

    .npm-userscript-issue-pr-link:focus,
    .npm-userscript-issue-pr-link:hover {
      text-decoration: underline;
      color: #cb3837;
    }
  `)
}

export async function run() {
  if (!isValidPackagePage()) return

  // Wait 2 seconds to allow npm to render first in case it works
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Skip if npm already renders them
  if (document.getElementById('issues') || document.getElementById('pulls')) {
    // Just make sure they're on the same row
    getTotalFilesColumn() // this function will automatically fix the layout
    return
  }
  // Skip if already run
  if (document.querySelector('.npm-userscript-issue-pr-count')) return

  const ownerRepo = getGitHubOwnerRepo()
  if (!ownerRepo) return

  const counts = await fetchIssueAndPrCount(ownerRepo)

  let ref: HTMLElement | undefined
  if ((await getFeatureSettings())['stars'].get() === true) {
    // If the stars feature is enabled, wait for it to render first
    ref = await waitForElement('.npm-userscript-stars-column', 5000)
  } else {
    // Place the counts in the sidebar after the "Total Files" section
    ref = getTotalFilesColumn()
  }
  if (!ref) return

  // Just in case again, if npm has rendered them, skip
  if (document.getElementById('issues') || document.getElementById('pulls')) return

  insertCountNode(ref, 'Pull Requests', counts.pulls, `https://github.com/${ownerRepo}/pulls`)
  insertCountNode(ref, 'Issues', counts.issues, `https://github.com/${ownerRepo}/issues`)
}

function getTotalFilesColumn(): HTMLElement | undefined {
  const sidebarColumns = document.querySelectorAll(
    '[aria-label="Package sidebar"] div.w-50:not(.w-100)',
  )
  const refIndex = Array.from(sidebarColumns).findIndex((el) =>
    el.querySelector('h3')?.textContent.includes('Total Files'),
  )
  if (refIndex === -1) return

  const ref = sidebarColumns[refIndex] as HTMLElement
  if (refIndex % 2 === 0) {
    // The issue and pr count must be on the same row, so if the total files column's row isn't filled,
    // we need to extend it to full width
    ref.classList.add('w-100')
  }
  return ref
}

function insertCountNode(ref: Element, name: string, count: number, link: string) {
  const cloned = ref.cloneNode(true) as HTMLElement
  cloned.classList.add('npm-userscript-issue-pr-count')
  cloned.classList.remove('w-100')
  cloned.querySelector('h3')!.textContent = name
  const linkHtml = `<a class="npm-userscript-issue-pr-link" href="${link}">${count}</a>`
  cloned.querySelector('p')!.innerHTML = linkHtml
  ref.insertAdjacentElement('afterend', cloned)
}

async function fetchIssueAndPrCount(ownerRepo: string): Promise<{ issues: number; pulls: number }> {
  const data = await fetchGitHubRepoData()
  if (!data) return { issues: 0, pulls: 0 }

  const prCount = await cacheResult(`fetchIssueAndPrCount:${ownerRepo}`, 60, async () => {
    const headers = await fetchHeaders(`https://api.github.com/repos/${ownerRepo}/pulls?per_page=1`)
    // Example header:
    // ...
    // Link: <https://api.github.com/repositories/74293321/pulls?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/74293321/pulls?per_page=1&page=75>; rel="last"
    // ...
    // Fetch the last page= number
    const match =
      /<https:\/\/api\.github\.com\/repositories\/\d+\/pulls\?per_page=1&page=(\d+)>;\s*rel="last"/.exec(
        headers,
      )
    return match ? Number(match[1]) : 0
  })

  const issueAndPrCount = data.open_issues_count as number
  const issues = issueAndPrCount - prCount
  const pulls = prCount

  return { issues, pulls }
}

async function getFeatureSettings() {
  const settings = await import('../settings.ts')
  return settings.featureSettings
}
