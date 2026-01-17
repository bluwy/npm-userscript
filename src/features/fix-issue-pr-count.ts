import { cache } from '../utils-cache.ts'
import { fetchJson } from '../utils-fetch.ts'
import { addStyle, isValidPackagePage } from '../utils.ts'

export const description = `\
Show "Issue" and "Pull Requests" counts in the package sidebar. At the time of writing, npm's own
implementation is broken for large numbers for some reason. This temporarily fixes it.
`

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

  const repositoryLink = document.getElementById('repository-link')
  const repo = repositoryLink?.textContent?.match(/github\.com\/([^\/]+\/[^\/]+)/)?.[1]
  if (!repo) return

  const counts = await getIssueAndPrCount(repo)

  // Place the counts in the sidebar after the "Total Files" section
  const ref = getTotalFilesColumn()
  if (!ref) return

  // Just in case again, if npm has rendered them, skip
  if (document.getElementById('issues') || document.getElementById('pulls')) return

  insertCountNode(ref, 'Pull Requests', counts.pulls, `https://github.com/${repo}/pulls`)
  insertCountNode(ref, 'Issues', counts.issues, `https://github.com/${repo}/issues`)
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
  cloned.classList.remove('w-100')
  cloned.querySelector('h3')!.textContent = name
  const linkHtml = `<a class="npm-userscript-issue-pr-link" href="${link}">${count}</a>`
  cloned.querySelector('p')!.innerHTML = linkHtml
  ref.insertAdjacentElement('afterend', cloned)
}

async function getIssueAndPrCount(repo: string): Promise<{ issues: number; pulls: number }> {
  const cached = cache.get(`issue-pr-count:${repo}`)
  if (cached) return JSON.parse(cached)

  const issues = fetchJson(
    `https://api.github.com/search/issues?q=repo:${repo}+type:issue+state:open&per_page=0`,
  )
    .then((data) => data.total_count ?? 0)
    .catch(() => 0)

  const pulls = fetchJson(
    `https://api.github.com/search/issues?q=repo:${repo}+type:pr+state:open&per_page=0`,
  )
    .then((data) => data.total_count ?? 0)
    .catch(() => 0)

  const promises = await Promise.all([issues, pulls])
  const result = { issues: promises[0], pulls: promises[1] }
  cache.set(`issue-pr-count:${repo}`, JSON.stringify(result), 60) // Cache result for 1 minute
  return result
}
