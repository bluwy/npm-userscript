import { addStyle, listenNavigate } from '../utils.ts'

export const description = `\
Improved package versions tab with compact table view, show tags next to versions, and fix
provenance icon alignment.
`

interface MajorInfo {
  totalDownloads: number
  lastPublished: string
}

export function runPre() {
  if (!location.pathname.startsWith('/package/')) return

  // Make row compact
  addStyle(`
    table[aria-labelledby="current-tags"] tbody tr td,
    table[aria-labelledby="major-versions"] tbody tr td,
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
    /* table[aria-labelledby="current-tags"] th:nth-child(1), */
    table[aria-labelledby="version-history"] th:nth-child(1) {
      width: 37%;
    }
    /* table[aria-labelledby="current-tags"] th:nth-child(2), */
    table[aria-labelledby="version-history"] th:nth-child(2) {
      width: 30%;
    }
    /* table[aria-labelledby="current-tags"] th:nth-child(3), */
    table[aria-labelledby="version-history"] th:nth-child(3) {
      width: 33%;
    }
  `)

  // Adjust heading spacing
  addStyle(`
    #current-tags {
      margin-bottom: 0;
    }

    #major-versions,
    #version-history {
      margin-top: 2rem;
      margin-bottom: 0;
    }
  `)
}

export function run() {
  _run()
  listenNavigate(() => _run())
}

function _run() {
  if (!location.pathname.startsWith('/package/')) return

  addVersionTag()
  addMajorVersionsTable()
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

function addMajorVersionsTable() {
  // Skip if already run
  if (document.getElementById('major-versions')) return

  const versionHistoryH3 = document.querySelector('h3#version-history')
  if (!versionHistoryH3) return
  const versionHistoryTable = document.querySelector('table[aria-labelledby="version-history"]')
  if (!versionHistoryTable) return

  const newH3 = versionHistoryH3.cloneNode(true) as HTMLElement
  newH3.id = 'major-versions'
  newH3.textContent = 'Major Versions'

  const newTable = versionHistoryTable.cloneNode(true) as HTMLElement
  newTable.setAttribute('aria-labelledby', 'major-versions')
  const newBody = newTable.querySelector('tbody')
  if (!newBody) return

  const majorToInfo: Record<string, MajorInfo> = {}
  versionHistoryTable.querySelectorAll('tbody tr').forEach((row) => {
    const versionLink = row.querySelector('td a')
    if (!versionLink) return
    const version = versionLink.textContent || ''
    const major = version.split('.')[0]
    const downloadsTd = row.querySelector('td:nth-child(2)')
    const publishedTd = row.querySelector('td:nth-child(3)')
    if (!downloadsTd || !publishedTd) return
    const downloadsText = downloadsTd.textContent || '0'
    const downloads = parseInt(downloadsText.replace(/,|\./g, ''), 10) || 0
    const publishedText = publishedTd.textContent || ''

    if (!majorToInfo[major]) {
      majorToInfo[major] = {
        totalDownloads: 0,
        lastPublished: publishedText,
      }
    }
    majorToInfo[major].totalDownloads += downloads
  })

  // Clear existing rows
  newBody.innerHTML = ''

  // Add major version rows
  const keys = Object.keys(majorToInfo).sort((a, b) => parseInt(b) - parseInt(a))
  for (const major of keys) {
    const info = majorToInfo[major]
    const row = document.createElement('tr')
    row.innerHTML = `
      <td><span class="f5 black-60 lh-copy code">${major}.x</span></td>
      <td>${info.totalDownloads.toLocaleString()}</td>
      <td>${info.lastPublished}</td>
    `
    newBody.appendChild(row)
  }

  versionHistoryH3.insertAdjacentElement('beforebegin', newH3)
  versionHistoryH3.insertAdjacentElement('beforebegin', newTable)
}
