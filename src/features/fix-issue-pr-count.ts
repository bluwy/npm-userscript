import { fetchGitHubPullRequestsCount, fetchGitHubRepoData } from '../utils-fetch.ts'
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

export async function runPre() {
  if (!isValidPackagePage()) return
  // Info will be in the card, no need to render
  if ((await getFeatureSettings())['repository-card'].get() === true) return

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
  // Info will be in the card, no need to render
  if ((await getFeatureSettings())['repository-card'].get() === true) return

  // Wait 2 seconds to allow npm to render first in case it works
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Skip if npm already renders them
  if (document.getElementById('issues') || document.getElementById('pulls')) return
  // Skip if already run
  if (document.querySelector('.npm-userscript-issue-pr-count')) return

  const ownerRepo = getGitHubOwnerRepo()
  if (!ownerRepo) return

  const counts = await fetchIssueAndPrCount()

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
  const c = insertCountNode(ref, 'Issues', counts.issues, `https://github.com/${ownerRepo}/issues`)
  balanceColumn(c)
}

function getTotalFilesColumn(): HTMLElement | undefined {
  const sidebarColumns = document.querySelectorAll<HTMLElement>(
    '[aria-label="Package sidebar"] div.w-50:not(.w-100)',
  )
  return Array.from(sidebarColumns).find((el) =>
    el.querySelector('h3')?.textContent.includes('Total Files'),
  )
}

// The issue and pr count must be on the same row, so if the total files column's row isn't filled,
// we need to extend it to full width
function balanceColumn(column: HTMLElement) {
  const sidebarColumns = document.querySelectorAll(
    '[aria-label="Package sidebar"] div.w-50:not(.w-100)',
  )
  const columnIndex = Array.from(sidebarColumns).indexOf(column)
  if (columnIndex % 2 === 1) {
    const previousColumn = sidebarColumns[columnIndex - 1]
    if (!previousColumn) return
    previousColumn.classList.add('w-100')
  }
}

function insertCountNode(ref: Element, name: string, count: number, link: string) {
  const cloned = ref.cloneNode(true) as HTMLElement
  cloned.classList.add('npm-userscript-issue-pr-count')
  cloned.classList.remove('w-100')
  cloned.querySelector('h3')!.textContent = name
  const linkHtml = `<a class="npm-userscript-issue-pr-link" href="${link}">${count}</a>`
  cloned.querySelector('p')!.innerHTML = linkHtml
  ref.insertAdjacentElement('afterend', cloned)
  return cloned
}

async function fetchIssueAndPrCount(): Promise<{ issues: number; pulls: number }> {
  const data = await fetchGitHubRepoData()
  if (!data) return { issues: 0, pulls: 0 }

  const prCount = await fetchGitHubPullRequestsCount()
  if (prCount === undefined) return { issues: 0, pulls: 0 }

  const issueAndPrCount = data.open_issues_count as number
  const issues = issueAndPrCount - prCount
  const pulls = prCount

  return { issues, pulls }
}

async function getFeatureSettings() {
  const settings = await import('../settings.ts')
  return settings.featureSettings
}
