import { addStyle } from '../utils.ts'

export const description = `\
Show "Issue" and "Pull Requests" counts in the package sidebar. At the time of writing, npm's own
implementation is broken for large numbers for some reason. This temporarily fixes it.
`

export function runPre() {
  if (!location.pathname.startsWith('/package/')) return

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
}

export async function run() {
  if (!location.pathname.startsWith('/package/')) return

  // Wait 2 seconds to allow npm to render first in case it works
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Skip if npm already renders them
  if (document.getElementById('issues') || document.getElementById('pulls')) return

  const repositoryLink = document.getElementById('repository-link')
  const repo = repositoryLink?.textContent?.match(/github\.com\/([^\/]+\/[^\/]+)/)?.[1]
  if (!repo) return

  const counts = await getIssueAndPrCount(repo)

  // Place the counts in the sidebar after the "Total Files" section
  const sidebar = document.querySelector('[aria-label="Package sidebar"]')
  if (!sidebar) return

  const ref = Array.from(sidebar.children).find((el) =>
    el.querySelector('h3')?.textContent.includes('Total Files'),
  )
  if (!ref) return

  // Just in case again, if npm has rendered them, skip
  if (document.getElementById('issues') || document.getElementById('pulls')) return

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
  insertCountNode(ref, 'Pull Requests', counts.pulls, `https://github.com/${repo}/pulls`)
  insertCountNode(ref, 'Issues', counts.issues, `https://github.com/${repo}/issues`)
}

function insertCountNode(ref: Element, name: string, count: number, link: string) {
  const cloned = ref.cloneNode(true) as HTMLElement
  cloned.querySelector('h3')!.textContent = name
  const linkHtml = `<a class="npm-userscript-issue-pr-link" href="${link}">${count}</a>`
  cloned.querySelector('p')!.innerHTML = linkHtml
  ref.insertAdjacentElement('afterend', cloned)
}

async function getIssueAndPrCount(repo: string): Promise<{ issues: number; pulls: number }> {
  const issues = fetch(
    `https://api.github.com/search/issues?q=repo:${repo}+type:issue+state:open&per_page=0`,
  )
    .then((res) => res.json())
    .then((data) => data.total_count)
    .catch(() => 0)

  const pulls = fetch(
    `https://api.github.com/search/issues?q=repo:${repo}+type:pr+state:open&per_page=0`,
  )
    .then((res) => res.json())
    .then((data) => data.total_count)
    .catch(() => 0)

  const result = await Promise.all([issues, pulls])
  return { issues: result[0], pulls: result[1] }
}
