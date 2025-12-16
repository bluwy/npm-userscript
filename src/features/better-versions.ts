import { addStyle, listenNavigate } from '../utils.ts'

export const description = `\
Improved package versions tab with compact table view, show tags next to versions, and fix
provenance icon alignment.
`

interface VersionInfo {
  totalDownloads: number
  lastPublished: string
}

export function runPre() {
  if (!location.pathname.startsWith('/package/')) return

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

  // Styles for cumulated versions table
  addStyle(`
    table[aria-labelledby="cumulated-versions"] .npm-userscript-cumulated-versions-minor {
      display: none;
    }
    table[aria-labelledby="cumulated-versions"] .npm-userscript-cumulated-versions-minor[open] {
      display: table-row-group;
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
  versionHistoryTable.querySelectorAll('tbody tr').forEach((row) => {
    const versionLink = row.querySelector('td a')
    if (!versionLink) return
    const version = versionLink.textContent || ''
    const major = version.split('.')[0]
    const minor = version.split('.').slice(0, 2).join('.')
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

    if (!minorToInfo[minor]) {
      minorToInfo[minor] = {
        totalDownloads: 0,
        lastPublished: publishedText,
      }
    }
    minorToInfo[minor].totalDownloads += downloads
  })

  // Clear existing rows and add our own rows
  newBody.remove()

  const keys = Object.keys(majorToInfo).sort((a, b) => parseInt(b) - parseInt(a))
  for (const major of keys) {
    const majorInfo = majorToInfo[major]

    // The major tbody that can be toggled to show minor versions
    const majorTbody = document.createElement('tbody')
    majorTbody.innerHTML = `
      <tr>
        <td style="cursor: pointer;"><span class="f5 black-80 lh-copy code">${major}.x</span></td>
        <td>${majorInfo.totalDownloads.toLocaleString()}</td>
        <td>${majorInfo.lastPublished}</td>
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
      minorTbody.innerHTML += `
        <tr>
          <td><span class="f6 black-80 code ml3">${minor}.x</span></td>
          <td class="o-80">${minorInfo.totalDownloads.toLocaleString()}</td>
          <td class="o-80">${minorInfo.lastPublished}</td>
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
