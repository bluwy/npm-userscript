import { getNpmContext } from '../utils-npm-context.ts'
import { addStyle, isValidPackagePage } from '../utils.ts'

export const description = `\
Improved package versions tab with compact table view, collapsed large tags table, cumulated
versions table, show tags next to versions, and fix provenance icon alignment.
`

interface VersionInfo {
  totalDownloads: number
  lastPublished: { ts: number; rel: string }
}

export function runPre() {
  if (!isValidPackagePage()) return

  // Make row compact
  addStyle(`
    table[aria-labelledby="current-tags"] tbody tr td,
    table[aria-labelledby="cumulated-versions"] tbody tr td,
    table[aria-labelledby="version-history"] tbody tr td {
      padding-bottom: 8px;
    }
  `)

  // Fix provenance icon alignment in versions tab. ffs
  // NOTE: No matter what style the popover seems fucked on Safari, can't fix that.
  addStyle(`
    table[aria-labelledby="current-tags"] td > span:last-child > div,
    table[aria-labelledby="version-history"] td > span:last-child > div,
    table[aria-labelledby="current-tags"] td > span:last-child > div > button,
    table[aria-labelledby="version-history"] td > span:last-child > div > button {
      display: inline-block;
    }

    table[aria-labelledby="current-tags"] td > span:last-child > div > div,
    table[aria-labelledby="version-history"] td > span:last-child > div > div {
      right: calc(50% - 2px);
    }
  `)

  // Fix table columns (original 27/40/33)
  addStyle(`
    table[aria-labelledby="current-tags"] th:nth-child(1),
    table[aria-labelledby="cumulated-versions"] th:nth-child(1),
    table[aria-labelledby="version-history"] th:nth-child(1) {
      width: 37%;
    }
    table[aria-labelledby="current-tags"] th:nth-child(2),
    table[aria-labelledby="cumulated-versions"] th:nth-child(2),
    table[aria-labelledby="version-history"] th:nth-child(2) {
      width: 30%;
    }
    table[aria-labelledby="current-tags"] th:nth-child(3),
    table[aria-labelledby="cumulated-versions"] th:nth-child(3),
    table[aria-labelledby="version-history"] th:nth-child(3) {
      width: 33%;
    }
  `)

  // Adjust heading spacing
  addStyle(`
    #current-tags {
      margin-bottom: 0;
    }

    #cumulated-versions,
    #version-history {
      margin-top: 2rem;
      margin-bottom: 0;
    }
  `)

  // Styles for collapsed large tags table
  addStyle(`
    table[aria-labelledby="current-tags"] .npm-userscript-tag-show-more-td {
      padding: 0;
      column-width: auto
    }
    table[aria-labelledby="current-tags"] .npm-userscript-tag-show-more-button {
      display: block;
      width: 100%;
      cursor: pointer;
      background-color: transparent;
      border: none;
      padding: 8px;
      opacity: 0.8;
    }
    table[aria-labelledby="current-tags"] .npm-userscript-tag-show-more-button:hover,
    table[aria-labelledby="current-tags"] .npm-userscript-tag-show-more-button:focus {
      opacity: 1;
    }
  `)

  // Styles for cumulated versions table
  addStyle(`
    table[aria-labelledby="cumulated-versions"] .npm-userscript-cumulated-versions-minor {
      display: none;
    }
    table[aria-labelledby="cumulated-versions"] .npm-userscript-cumulated-versions-minor[open] {
      display: table-row-group;
    }
  `)

  // Make border lighter in dark mode
  addStyle(`
    html[data-color-mode="dark"] table[aria-labelledby="current-tags"] thead th,
    html[data-color-mode="dark"] table[aria-labelledby="current-tags"] tbody td,
    html[data-color-mode="dark"] table[aria-labelledby="cumulated-versions"] thead th,
    html[data-color-mode="dark"] table[aria-labelledby="cumulated-versions"] tbody td,
    html[data-color-mode="dark"] table[aria-labelledby="version-history"] thead th,
    html[data-color-mode="dark"] table[aria-labelledby="version-history"] tbody td {
      border-color: var(--color-border-default);
    }
  `)
}

export function run() {
  if (!isValidPackagePage()) return
  if (new URLSearchParams(location.search).get('activeTab') !== 'versions') return

  addVersionTag()
  collapseLargeTagsTable()
  addCumulatedVersionsTable()
}

function addVersionTag() {
  // Skip if already run
  if (document.querySelector('.npm-userscript-tag')) return

  const versionToTags: Record<string, string[]> = {}
  document.querySelectorAll('table[aria-labelledby="current-tags"] tr').forEach((row) => {
    const version = row.querySelector('td a')?.textContent
    const tag = row.querySelector('td:last-child')?.textContent
    if (version && tag) {
      if (!versionToTags[version]) {
        versionToTags[version] = []
      }
      versionToTags[version].push(tag)
    }
  })

  for (const [version, tags] of Object.entries(versionToTags)) {
    const row = document.querySelector(
      `table[aria-labelledby="version-history"] tr td a[href$="/v/${version}"]`,
    )
    row?.insertAdjacentHTML(
      'afterend',
      `<span class="npm-userscript-tag ml2">(${tags.join(', ')})</span>`,
    )
  }
}

const largeTagsNumber = 10
const insignificantDownloadsThreshold = 10

function collapseLargeTagsTable() {
  const tagsTable = document.querySelector('table[aria-labelledby="current-tags"]')
  if (!tagsTable) return

  const tbody = tagsTable.querySelector('tbody')
  if (!tbody) return

  const rows = tbody.querySelectorAll('tr')
  if (rows.length <= largeTagsNumber) return

  // Search bottom up until one row passes the threshold
  const insignificantRows: HTMLTableRowElement[] = []
  for (let i = rows.length - 1; i >= 0; i--) {
    const downloadsCell = rows[i].querySelector('td:nth-child(2)')
    if (!downloadsCell) continue
    const downloadsText = downloadsCell.textContent?.replace(/[^0-9]/g, '') || '0'
    if (parseInt(downloadsText) <= insignificantDownloadsThreshold) {
      insignificantRows.push(rows[i])
    } else {
      break
    }
  }

  // Add a "Show more" button at the last row
  const lastRow = document.createElement('tr')
  lastRow.innerHTML = `
    <td colspan="3" class="npm-userscript-tag-show-more-td">
      <button class="npm-userscript-tag-show-more-button">
        Show ${insignificantRows.length} more
      </button>
    </td>
  `
  lastRow.querySelector('button')!.addEventListener('click', () => {
    for (const row of insignificantRows) {
      row.style.display = ''
    }
    lastRow.style.display = 'none'
  })
  tbody.appendChild(lastRow)

  // Hide insignificant rows
  for (const row of insignificantRows) {
    row.style.display = 'none'
  }
}

function addCumulatedVersionsTable() {
  // Skip if already run
  if (document.getElementById('cumulated-versions')) return

  const versionHistoryH3 = document.querySelector('h3#version-history')
  if (!versionHistoryH3) return
  const versionHistoryTable = document.querySelector('table[aria-labelledby="version-history"]')
  if (!versionHistoryTable) return

  const newH3 = versionHistoryH3.cloneNode(true) as HTMLElement
  newH3.id = 'cumulated-versions'
  newH3.textContent = 'Cumulated Versions'

  const newTable = versionHistoryTable.cloneNode(true) as HTMLElement
  newTable.setAttribute('aria-labelledby', 'cumulated-versions')
  const newBody = newTable.querySelector('tbody')
  if (!newBody) return

  const majorToInfo: Record<string, VersionInfo> = {}
  const minorToInfo: Record<string, VersionInfo> = {}
  const npmContext = getNpmContext()

  for (const entry of npmContext.context.packument.versions) {
    const version = entry.version
    const major = version.split('.')[0]
    const minor = version.split('.').slice(0, 2).join('.')
    const downloads = npmContext.context.versionsDownloads[version] || 0
    const lastPublished = entry.date

    if (!majorToInfo[major]) {
      majorToInfo[major] = { totalDownloads: 0, lastPublished }
    }
    majorToInfo[major].totalDownloads += downloads

    if (!minorToInfo[minor]) {
      minorToInfo[minor] = { totalDownloads: 0, lastPublished }
    }
    minorToInfo[minor].totalDownloads += downloads
  }

  // Clear existing rows and add our own rows
  newBody.remove()

  const keys = Object.keys(majorToInfo).sort((a, b) => parseInt(b) - parseInt(a))
  for (const major of keys) {
    const majorInfo = majorToInfo[major]
    const majorDate = new Date(majorInfo.lastPublished.ts)

    // The major tbody that can be toggled to show minor versions
    const majorTbody = document.createElement('tbody')
    majorTbody.innerHTML = `
      <tr>
        <td style="cursor: pointer;">
          <span class="f5 black-80 lh-copy code">${major}.x</span>
        </td>
        <td>${majorInfo.totalDownloads.toLocaleString()}</td>
        <td class="f5 black-60 lh-copy">
          <time datetime="${majorDate.toISOString()}" title="${majorDate.toLocaleString()}">
            ${majorInfo.lastPublished.rel}
          </time>
        </td>
      </tr>
    `

    const minorTbody = document.createElement('tbody')
    minorTbody.className = 'npm-userscript-cumulated-versions-minor'
    const minorKeys = Object.keys(minorToInfo)
      .filter((k) => k.startsWith(major + '.'))
      .sort((a, b) => {
        const [aMajor, aMinor] = a.split('.').map((n) => parseInt(n, 10))
        const [bMajor, bMinor] = b.split('.').map((n) => parseInt(n, 10))
        if (aMajor !== bMajor) return bMajor - aMajor
        return bMinor - aMinor
      })
    for (const minor of minorKeys) {
      const minorInfo = minorToInfo[minor]
      const minorDate = new Date(minorInfo.lastPublished.ts)
      minorTbody.innerHTML += `
        <tr>
          <td><span class="f6 black-80 code ml3">${minor}.x</span></td>
          <td class="o-80">${minorInfo.totalDownloads.toLocaleString()}</td>
          <td class="o-80 f5 black-60 lh-copy">
            <time datetime="${minorDate.toISOString()}" title="${minorDate.toLocaleString()}">
              ${minorInfo.lastPublished.rel}
            </time>
          </td>
        </tr>
      `
    }

    // NOTE: This is incredibly inaccesible, but works for now
    majorTbody.querySelector('td')?.addEventListener('click', () => {
      minorTbody.toggleAttribute('open')
    })

    newTable.appendChild(majorTbody)
    newTable.appendChild(minorTbody)
  }

  versionHistoryH3.insertAdjacentElement('beforebegin', newH3)
  versionHistoryH3.insertAdjacentElement('beforebegin', newTable)
}
