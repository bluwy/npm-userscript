import { cacheResult } from '../utils-cache.ts'
import {
  fetchGitHubPullRequestsCount,
  fetchGitHubRepoData,
  fetchPackageJson,
  fetchStatus,
  getRepositoryFilePath,
} from '../utils-fetch.ts'
import { addStyle, isSamePackagePage, isValidPackagePage } from '../utils.ts'

export const description = `\
Consolidates all repository information in a card-like view in the package sidebar.
Enabling this would remove the "Stars", "Issues", and "Pull Requests" columns.
`

const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg>`
const issueSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>`
const pullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>`
const changelogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M5 8.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 5 8.25ZM4 10.5A.75.75 0 0 0 4 12h4a.75.75 0 0 0 0-1.5H4Z"></path><path d="M13-.005c1.654 0 3 1.328 3 3 0 .982-.338 1.933-.783 2.818-.443.879-1.028 1.758-1.582 2.588l-.011.017c-.568.853-1.104 1.659-1.501 2.446-.398.789-.623 1.494-.623 2.136a1.5 1.5 0 1 0 2.333-1.248.75.75 0 0 1 .834-1.246A3 3 0 0 1 13 16H3a3 3 0 0 1-3-3c0-1.582.891-3.135 1.777-4.506.209-.322.418-.637.623-.946.473-.709.923-1.386 1.287-2.048H2.51c-.576 0-1.381-.133-1.907-.783A2.68 2.68 0 0 1 0 2.995a3 3 0 0 1 3-3Zm0 1.5a1.5 1.5 0 0 0-1.5 1.5c0 .476.223.834.667 1.132A.75.75 0 0 1 11.75 5.5H5.368c-.467 1.003-1.141 2.015-1.773 2.963-.192.289-.381.571-.558.845C2.13 10.711 1.5 11.916 1.5 13A1.5 1.5 0 0 0 3 14.5h7.401A2.989 2.989 0 0 1 10 13c0-.979.338-1.928.784-2.812.441-.874 1.023-1.748 1.575-2.576l.017-.026c.568-.853 1.103-1.658 1.501-2.448.398-.79.623-1.497.623-2.143 0-.838-.669-1.5-1.5-1.5Zm-10 0a1.5 1.5 0 0 0-1.5 1.5c0 .321.1.569.27.778.097.12.325.227.74.227h7.674A2.737 2.737 0 0 1 10 2.995c0-.546.146-1.059.401-1.5Z"></path></svg>`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-repository-card')?.remove()
}

export function runPre() {
  if (!isValidPackagePage()) return

  addStyle(`
    .npm-userscript-repository-card {
      border: 1px solid var(--color-border-default);
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
    
    .npm-userscript-repository-card-title-repo {
      font-weight: bold;
    }

    .npm-userscript-repository-card-title-directory {
      font-weight: bold;
      color: #757575;
      text-wrap: nowrap;
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
    
    .npm-userscript-repository-card-title-separator {
      color: #757575;
    }

    .npm-userscript-repository-card-description {
      margin: 0;
      margin-top: 10px;
    }

    .npm-userscript-repository-card-entry {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-right: 20px;
    }
    .npm-userscript-repository-card-entry:last-child {
      margin-right: 0;
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

  const changelogLink = await getChangelogLink(repoData.full_name, directory)

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
      <a class="npm-userscript-repository-card-title-repo" href="${repoData.html_url}" rel="noopener noreferrer nofollow">
        ${repoData.full_name}
      </a>
      ${
        directory
          ? `
            <span class="npm-userscript-repository-card-title-separator">/</span>
            <a class="npm-userscript-repository-card-title-directory" href="${fullRepoLink}" title="${directory}" rel="noopener noreferrer nofollow">
              ${directory}
            </a>
            `
          : ''
      }
    </div>
    <div class="npm-userscript-repository-card-description">
      <a class="npm-userscript-repository-card-entry" href="${repoData.html_url}/stargazers" title="${repoData.stargazers_count} stars" rel="noopener noreferrer nofollow">
        ${starSvg}
        ${repoData.stargazers_count.toLocaleString()}
      </a>
      <a class="npm-userscript-repository-card-entry" href="${repoData.html_url}/issues" title="${issueCount} issues" rel="noopener noreferrer nofollow" style="gap: 5px;">
        ${issueSvg}
        ${issueCount.toLocaleString()}
      </a>
      <a class="npm-userscript-repository-card-entry" href="${repoData.html_url}/pulls" title="${prCount} pull requests" rel="noopener noreferrer nofollow">
        ${pullSvg}
        ${prCount.toLocaleString()}
      </a>
      ${
        changelogLink
          ? `
            <a class="npm-userscript-repository-card-entry" href="${changelogLink}" rel="noopener noreferrer nofollow" style="font-size: 90%">
              ${changelogSvg} Changelog
            </a>
            `
          : ''
      }
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

async function getChangelogLink(
  ownerRepo: string,
  directory: string | undefined,
): Promise<string | undefined> {
  const changelogPath = directory ? directory + '/CHANGELOG.md' : 'CHANGELOG.md'

  return cacheResult(`getChangelogLink:${ownerRepo}:${directory}`, 600, async () => {
    const status = await fetchStatus(
      `https://api.github.com/repos/${ownerRepo}/contents/${changelogPath}`,
    )
    if (status === 200) {
      return getRepositoryFilePath(changelogPath)
    }
  })
}
