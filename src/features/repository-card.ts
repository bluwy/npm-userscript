import {
  fetchGitHubPullRequestsCount,
  fetchGitHubRepoData,
  fetchPackageJson,
} from '../utils-fetch.ts'
import { addStyle, isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Consolidates all repository information in a card-like view in the package sidebar.
Enabling this would remove the "Stars", "Issues", and "Pull Requests" columns.
`

const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg>`
const issueSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>`
const pullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-repository-card')?.remove()
}

export function runPre() {
  if (!isValidPackagePage()) return

  addStyle(`
    .npm-userscript-repository-card {
      border: 1px solid #cccccc;
      border-radius: 5px;
      padding: 10px;
      margin-top: 14px;
      margin-right: -8px;
      font-size: 18px;
    }

    .npm-userscript-repository-card-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
    }
    
    .npm-userscript-card-title-separator,
    .npm-userscript-card-title-separator + a {
      color: #757575;
    }

    .npm-userscript-repository-card-description {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 0;
      margin-top: 10px;
    }

    .npm-userscript-repository-card-entry {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .npm-userscript-repository-card a {
      text-decoration: none;
    }

    .npm-userscript-repository-card a:focus,
    .npm-userscript-repository-card a:hover {
      text-decoration: underline;
      color: #cb3837;
    }
  `)

  addStyle(`
    .npm-userscript-repository-card + p {
      display: none;
    }
  `)
}

export async function run() {
  if (!isValidPackagePage()) return
  if (document.querySelector('.npm-userscript-repository-card')) return

  const repositoryH3 = document.getElementById('repository')
  if (!repositoryH3) return

  const repoData = await fetchGitHubRepoData()
  if (!repoData) return
  const prCount = await fetchGitHubPullRequestsCount()
  if (prCount === undefined) return

  const issueCount = repoData.open_issues_count - prCount

  const packageJson = await fetchPackageJson()
  let directory = packageJson?.repository?.directory
  if (directory) {
    directory = directory.replace(/^\/+/, '').replace(/\/+$/, '')
  }
  const fullRepoLink =
    repoData.html_url + (directory ? `/tree/${repoData.default_branch}/${directory}` : '')

  const card = document.createElement('div')
  card.className = 'npm-userscript-repository-card'
  card.innerHTML = `
    <div class="npm-userscript-repository-card-title">
      <img
        src="${repoData.owner.avatar_url}"
        alt="Repo logo"
        width="24"
        height="24"
        style="border-radius: ${repoData.organization ? '3px' : '100%'}"
      >
      <a class="fw6" href="${repoData.html_url}" rel="noopener noreferrer nofollow">
        ${repoData.full_name}
      </a>
      ${
        directory
          ? `
            <span class="npm-userscript-card-title-separator">/</span>
            <a class="fw6" href="${fullRepoLink}" rel="noopener noreferrer nofollow">
              ${directory}
            </a>
            `
          : ''
      }
    </div>
    <div class="npm-userscript-repository-card-description">
      <a class="npm-userscript-repository-card-entry" href="${repoData.html_url}/stargazers" rel="noopener noreferrer nofollow">
        ${starSvg}
        ${repoData.stargazers_count.toLocaleString()}
      </a>
      <a class="npm-userscript-repository-card-entry" href="${repoData.html_url}/issues" rel="noopener noreferrer nofollow" style="gap: 7px;">
        ${issueSvg}
        ${issueCount.toLocaleString()}
      </a>
      <a class="npm-userscript-repository-card-entry" href="${repoData.html_url}/pulls" rel="noopener noreferrer nofollow">
        ${pullSvg}
        ${prCount.toLocaleString()}
      </a>
    </div>
  `

  repositoryH3.insertAdjacentElement('afterend', card)
  repositoryH3.parentElement?.classList.remove('bb')

  // Remove the issues and prs columns
  const sidebarColumns = document.querySelectorAll('[aria-label="Package sidebar"] > div:has(> h3)')
  for (const col of sidebarColumns) {
    const h3Text = col.querySelector('h3')?.textContent
    if (h3Text === 'Issues' || h3Text === 'Pull Requests') {
      col.remove()
    }
  }
}
